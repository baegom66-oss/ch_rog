import {
  activeEventFor,
  eventDayLabel,
  eventSpotName,
  eventSpotOn,
} from "@/data/events";
import { buildCharacterSystemPrompt } from "@/lib/aiSystemPrompt";
import { formatMonthDay } from "@/lib/date";
import { generateJson, type GeminiConfig, type GeminiSchema } from "@/lib/gemini";
import {
  josa,
  LOG_KEYWORD_MAX,
  SNS_HASHTAG_MAX,
  toHashtags,
  toKeywords,
} from "@/lib/text";
import type {
  ActionLog,
  CharacterProfile,
  Facility,
  ScheduleItem,
  SnsPost,
  StoryEvent,
  World,
} from "@/types";

/** 생성 시점의 앱 데이터 스냅샷 */
export interface AiWorldContext {
  characters: CharacterProfile[];
  worlds: World[];
  facilities: Facility[];
  events: StoryEvent[];
  logs: ActionLog[];
  posts: SnsPost[];
  schedules: ScheduleItem[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function describeMoment(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${y}년 ${formatMonthDay(date)} (${weekday}요일) ${time}`;
}

function sceneFor(character: CharacterProfile, ctx: AiWorldContext, date: string) {
  const world = ctx.worlds.find((w) => w.id === character.worldId) ?? ctx.worlds[0];
  const worldmates = ctx.characters.filter((c) => c.worldId === character.worldId);
  const places = ctx.facilities.filter((f) => f.worldId === character.worldId);
  const event = activeEventFor(character, ctx.events, date);
  return {
    worldmates,
    event,
    system: buildCharacterSystemPrompt(character, world, worldmates, places, event, date),
  };
}

function eventLine(event: StoryEvent | undefined, date: string) {
  if (!event) return "";
  const spot = eventSpotOn(event, date);
  return `\n- 오늘은 이벤트 '${event.emoji} ${event.title}' ${eventDayLabel(event, date)}이다. 오늘 머무는 곳: ${eventSpotName(event, spot)}`;
}

function recentLogLines(logs: ActionLog[], characterId: string, count: number) {
  const lines = logs
    .filter((l) => l.characterId === characterId)
    .sort((a, b) => `${b.date ?? ""}${b.time}`.localeCompare(`${a.date ?? ""}${a.time}`))
    .slice(0, count)
    .map((l) => `- ${l.date ? `${formatMonthDay(l.date)} ` : ""}${l.time} · ${l.location} · ${l.summary}`);
  return lines.length > 0 ? lines.join("\n") : "- (아직 없음)";
}

function clean(value: unknown, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanList(value: unknown, max: number) {
  return Array.isArray(value)
    ? value.map((v) => clean(v, 40).replace(/^#/, "")).filter(Boolean).slice(0, max)
    : [];
}

/* ───────── 타임라인 ───────── */

const TIMELINE_RULES = `
---
# 출력 규칙: 타임라인 로그
- 한국어로, 관찰자가 지켜보는 3인칭 관찰 일기 톤으로 쓴다.
- location: 지금 있는 장소 이름 하나 (이 세계의 장소·단골 장소·이벤트 시설 중 자연스러운 곳).
- summary: 지금 시각에 한 행동을 2~3문장으로.
- innerThought: 캐릭터 말투 그대로의 속마음 한 문장 (따옴표 없이).
- detail: 【HH:MM】 장소 형식의 소제목으로 나눈 3~5개 장면. 행동 묘사와 대사(이름: "대사"), 속마음(이름 (속마음): ...)을 섞어 400~900자.
- companions: 함께 있던 같은 세계 캐릭터 이름 배열. 혼자였으면 빈 배열. 위 관계 목록에 없는 이름은 절대 쓰지 않는다.
- placeTags: 장소·상황을 나타내는 짧은 키워드 1~3개 (해시태그가 아닌 단어, # 없이).
- contextNote: 이동·동행 맥락 한 줄 (예: 단골 카페인 [달무리 카페]로 이동).
- 시각·요일·수면 패턴에 어울리는 행동만 쓴다. 최근 기록과 같은 내용을 반복하지 않는다.
`;

const TIMELINE_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  properties: {
    location: { type: "STRING" },
    summary: { type: "STRING" },
    innerThought: { type: "STRING" },
    detail: { type: "STRING" },
    companions: { type: "ARRAY", items: { type: "STRING" } },
    placeTags: { type: "ARRAY", items: { type: "STRING" } },
    contextNote: { type: "STRING" },
  },
  required: ["location", "summary", "innerThought", "detail", "companions", "placeTags"],
};

export interface TimelineRequest {
  id: string;
  character: CharacterProfile;
  date: string;
  time: string;
}

export async function generateTimelineLog(
  config: GeminiConfig,
  ctx: AiWorldContext,
  { id, character, date, time }: TimelineRequest
): Promise<ActionLog> {
  const { worldmates, event, system } = sceneFor(character, ctx, date);
  const schedules = ctx.schedules
    .filter((s) => s.characterId === character.id && s.time >= time)
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((s) => `- ${s.time} ${s.title} @ ${s.location}`);

  const prompt = `# 작성할 것
- 지금: ${describeMoment(date, time)}
- ${josa(character.name, "이", "가")} 이 시각에 하고 있는 일을 타임라인 로그 1건으로 작성한다.${eventLine(event, date)}

# 최근 기록 (참고만, 반복 금지)
${recentLogLines(ctx.logs, character.id, 4)}

# 오늘 남은 스케줄
${schedules.length > 0 ? schedules.join("\n") : "- (없음)"}`;

  const raw = await generateJson<Record<string, unknown>>(config, {
    system: system + TIMELINE_RULES,
    prompt,
    schema: TIMELINE_SCHEMA,
  });

  const others = worldmates.filter((c) => c.id !== character.id);
  const companions = cleanList(raw.companions, 8)
    .map((name) => others.find((c) => c.name === name))
    .filter((c): c is CharacterProfile => Boolean(c));
  const summary = clean(raw.summary, 600);
  if (!summary) throw new Error("타임라인 내용이 비어 있어요.");
  const location = clean(raw.location, 80) || character.currentLocation || "어딘가";
  const keywords = toKeywords(cleanList(raw.placeTags, LOG_KEYWORD_MAX));

  return {
    id,
    characterId: character.id,
    date,
    time,
    location,
    summary,
    innerThought: clean(raw.innerThought, 200),
    detail: clean(raw.detail, 3000) || summary,
    isFavorite: false,
    companionIds: companions.map((c) => c.id),
    companionNames: companions.map((c) => c.name),
    placeTags: keywords.length > 0 ? keywords : [location],
    contextNote: clean(raw.contextNote, 120) || undefined,
    eventId: event?.id,
  };
}

/* ───────── SNS ───────── */

const SNS_RULES = `
---
# 출력 규칙: SNS 게시글
- 캐릭터 본인이 직접 올리는 SNS 글이다. 말투·이모지 습관은 성격과 말투 예시를 그대로 따른다.
- content: 1~4문장, 200자 이내. 해시태그는 본문에 넣지 않는다.
- hashtags: 1~5개, # 없이 짧게.
- 오늘의 타임라인과 이어지는 내용이면 좋다. 같은 세계 캐릭터 이야기는 관계에 맞는 거리감으로만.
- 최근 게시글과 비슷한 문장·주제를 반복하지 않는다.
`;

const SNS_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  properties: {
    content: { type: "STRING" },
    hashtags: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["content", "hashtags"],
};

export async function generateSnsContent(
  config: GeminiConfig,
  ctx: AiWorldContext,
  character: CharacterProfile,
  date: string,
  time: string
): Promise<{ content: string; hashtags: string[] }> {
  const { worldmates, event, system } = sceneFor(character, ctx, date);
  const mateIds = new Set(worldmates.map((c) => c.id));
  const ownPosts = ctx.posts
    .filter((p) => p.characterId === character.id && !p.sharedPostId)
    .slice(0, 4)
    .map((p) => `- ${p.content}`);
  const matePosts = ctx.posts
    .filter((p) => p.characterId !== character.id && mateIds.has(p.characterId) && !p.sharedPostId)
    .slice(0, 3)
    .map((p) => `- ${p.authorName}: ${p.content}`);

  const prompt = `# 작성할 것
- 지금: ${describeMoment(date, time)}
- ${josa(character.name, "이", "가")} 지금 올릴 SNS 게시글 1개를 작성한다.${eventLine(event, date)}

# 오늘의 타임라인 (최근순)
${recentLogLines(
  ctx.logs.filter((l) => !l.date || l.date === date),
  character.id,
  3
)}

# 내가 최근 올린 글 (반복 금지)
${ownPosts.length > 0 ? ownPosts.join("\n") : "- (없음)"}

# 같은 세계 친구들의 최근 글
${matePosts.length > 0 ? matePosts.join("\n") : "- (없음)"}`;

  const raw = await generateJson<Record<string, unknown>>(config, {
    system: system + SNS_RULES,
    prompt,
    schema: SNS_SCHEMA,
  });
  const content = clean(raw.content, 400);
  if (!content) throw new Error("SNS 글 내용이 비어 있어요.");
  return { content, hashtags: toHashtags(cleanList(raw.hashtags, SNS_HASHTAG_MAX)) };
}

/* ───────── SNS 댓글 ───────── */

const COMMENT_RULES = `
---
# 출력 규칙: SNS 댓글
- 캐릭터 본인이 친구의 게시글에 다는 댓글 한 개다.
- 위 관계 목록의 분류·친밀도·속마음에 맞는 거리감으로 쓴다. 사회성이 낮으면 짧고 건조하게.
- content: 1~2문장, 60자 이내. 해시태그 금지. 말투는 말투 예시를 그대로 따른다.
- 이미 달린 댓글과 같은 말을 반복하지 않는다.
`;

const COMMENT_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  properties: { content: { type: "STRING" } },
  required: ["content"],
};

export async function generateSnsComment(
  config: GeminiConfig,
  ctx: AiWorldContext,
  commenter: CharacterProfile,
  post: SnsPost,
  date: string,
  time: string
): Promise<string> {
  const { system } = sceneFor(commenter, ctx, date);
  const existing = post.comments.map((c) => `- ${c.authorName}: ${c.content}`);
  const prompt = `# 작성할 것
- 지금: ${describeMoment(date, time)}
- ${josa(commenter.name, "이", "가")} ${post.authorName}의 게시글에 댓글 1개를 단다.

# 게시글 (${post.authorName})
${post.content}
${post.hashtags.join(" ")}

# 이미 달린 댓글
${existing.length > 0 ? existing.join("\n") : "- (없음)"}`;

  const raw = await generateJson<Record<string, unknown>>(config, {
    system: system + COMMENT_RULES,
    prompt,
    schema: COMMENT_SCHEMA,
  });
  const content = clean(raw.content, 120);
  if (!content) throw new Error("댓글 내용이 비어 있어요.");
  return content;
}
