import { findRelationship } from "@/data/relationships";
import { toDateKey, toTimeKey } from "@/lib/date";
import {
  loadStoredJson,
  saveStoredJson,
  STORAGE_KEYS,
} from "@/lib/persistence";
import { pick, randInt } from "@/lib/random";
import { toneSnippet } from "@/lib/text";
import type { CharacterProfile, RelationshipType, SnsComment, SnsPost } from "@/types";

/** 이 사회성 이상이어야 지인 글에도 반응한다 */
const ACQUAINTANCE_MIN_SOCIABILITY = 65;
/** 사회성 0일 때 / 100일 때 반응에 필요한 최소 친밀도 */
const REQUIRED_AFFINITY = { atLowest: 80, atHighest: 20 };

const TYPE_WEIGHT: Partial<Record<RelationshipType, number>> = {
  lover: 1,
  friend: 0.85,
  family: 0.6,
  acquaintance: 0.45,
};

/**
 * actor가 author의 글에 댓글을 달거나 공유할 확률 (0~1).
 * 주로 친구·연인·가족에게 반응하고, 사회성이 낮을수록 친밀도가 높아야 한다.
 * 사회성이 높으면 지인 글에도 반응하고, 모르는 사이에는 반응하지 않는다.
 */
function engagementChance(
  actor: CharacterProfile,
  author: CharacterProfile,
  kind: "comment" | "share"
): number {
  if (actor.id === author.id || actor.worldId !== author.worldId) return 0;
  const rel = findRelationship(actor, author.id);
  const weight = TYPE_WEIGHT[rel.type];
  if (!weight) return 0;
  const sociability = actor.traits.sociability;
  if (rel.type === "acquaintance" && sociability < ACQUAINTANCE_MIN_SOCIABILITY) return 0;

  const social = sociability / 100;
  const { atLowest, atHighest } = REQUIRED_AFFINITY;
  const required = atLowest - (atLowest - atHighest) * social;
  if (rel.affinity < required) return 0;

  const warmth = (rel.affinity - required) / Math.max(1, 100 - required);
  const base = kind === "comment" ? 0.35 + 0.5 * warmth : 0.12 + 0.25 * warmth;
  return Math.min(0.95, base * weight * (0.6 + 0.6 * social));
}

/** 같은 세계 캐릭터들의 최신 글 중, 관계에 따라 공유하고 싶은 글 하나 (없으면 undefined) */
export function pickShareTarget(
  character: CharacterProfile,
  characters: CharacterProfile[],
  posts: SnsPost[]
): SnsPost | undefined {
  const latestByAuthor = new Map<string, SnsPost>();
  for (const p of posts) {
    if (p.sharedPostId || p.characterId === character.id || latestByAuthor.has(p.characterId)) {
      continue;
    }
    latestByAuthor.set(p.characterId, p);
  }
  const candidates = [...latestByAuthor.values()]
    .filter((p) => !posts.some((s) => s.characterId === character.id && s.sharedPostId === p.id))
    .sort(() => Math.random() - 0.5);
  return candidates.find((p) => {
    const author = characters.find((c) => c.id === p.characterId);
    return author && Math.random() < engagementChance(character, author, "share");
  });
}

const SHARE_CAPTIONS: Partial<Record<RelationshipType, string[]>> = {
  lover: ["이거 봐 🥹", "역시 내 사람.", "같이 있었으면 좋았을 텐데."],
  friend: ["ㅋㅋ 얘 좀 봐", "이건 퍼가야 함", "부럽다 진짜"],
  family: ["우리 집 자랑.", "잘 지내는 듯."],
  acquaintance: ["좋아 보여서 공유!", "여기 가 보고 싶다"],
};

/** 공유 글 본문. 사회성이 낮으면 말투 한마디만 짧게 */
export function shareCaption(sharer: CharacterProfile, author: CharacterProfile | undefined) {
  const tone = toneSnippet(sharer.toneQuotes);
  if (!author || sharer.traits.sociability < 35) return tone;
  const type = findRelationship(sharer, author.id).type;
  return pick(SHARE_CAPTIONS[type] ?? []) ?? tone;
}

const COMMENT_LINES: Partial<Record<RelationshipType, string[]>> = {
  lover: ["보고 싶다.", "나도 데려가지.", "사진 더 올려 줘.", "끝나고 연락해."],
  friend: ["ㅋㅋㅋ 뭐야 이거", "다음엔 나도 불러.", "좋아 보인다!", "여기 어디야?"],
  family: ["밥은 챙겨 먹었어?", "늦지 않게 들어가.", "재밌게 놀아."],
  acquaintance: ["오 좋네요!", "여기 어디예요?", "분위기 좋다."],
};
const SHY_COMMENT_LINES = ["ㅇㅇ", "…괜찮네.", "👍", "나쁘지 않네."];

/** AI가 꺼져 있거나 실패했을 때 쓰는 댓글 */
function templateComment(commenter: CharacterProfile, author: CharacterProfile) {
  const type = findRelationship(commenter, author.id).type;
  const tone = toneSnippet(commenter.toneQuotes);
  if (tone && Math.random() < 0.3) return tone;
  const lines =
    commenter.traits.sociability < 35 ? SHY_COMMENT_LINES : (COMMENT_LINES[type] ?? SHY_COMMENT_LINES);
  return pick(lines)!;
}

interface PendingComment {
  postId: string;
  characterId: string;
  time: string;
}

interface CommentPlan {
  date: string;
  /** 댓글을 달지 이미 정한 게시물 */
  decided: string[];
  /** 정해진 시각에 달 댓글 */
  pending: PendingComment[];
}

export interface CommentJob {
  post: SnsPost;
  commenter: CharacterProfile;
  author: CharacterProfile;
  /** AI가 꺼져 있거나 실패하면 이 댓글을 그대로 단다 */
  comment: SnsComment;
}

function laterTime(from: string, minutes: number) {
  const [h, m] = from.split(":").map(Number);
  const total = Math.min(23 * 60 + 59, h * 60 + m + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * 오늘 올라온 글마다 같은 세계 캐릭터가 댓글을 달지 한 번만 정하고,
 * 몇 분~1시간여 뒤 그 시각이 지나면 댓글 작업으로 돌려준다.
 */
export function runSnsComments(
  characters: CharacterProfile[],
  posts: SnsPost[],
  now: Date,
  pausedWorlds: Set<string>
): CommentJob[] {
  const today = toDateKey(now);
  const nowTime = toTimeKey(now);
  const stored = loadStoredJson<CommentPlan>(STORAGE_KEYS.snsCommentPlan);
  const plan: CommentPlan =
    stored && stored.date === today ? stored : { date: today, decided: [], pending: [] };
  const byId = new Map(characters.map((c) => [c.id, c]));
  const decided = new Set(plan.decided);

  for (const post of posts) {
    if (post.date !== today || post.sharedPostId || decided.has(post.id)) continue;
    decided.add(post.id);
    const author = byId.get(post.characterId);
    if (!author) continue;
    const start = post.time > nowTime ? post.time : nowTime;
    for (const c of characters) {
      if (pausedWorlds.has(c.worldId) || post.comments.some((x) => x.characterId === c.id)) continue;
      if (Math.random() < engagementChance(c, author, "comment")) {
        plan.pending.push({ postId: post.id, characterId: c.id, time: laterTime(start, randInt(3, 90)) });
      }
    }
  }

  const jobs: CommentJob[] = [];
  plan.pending = plan.pending.filter((p) => {
    if (p.time > nowTime) return true;
    const post = posts.find((x) => x.id === p.postId);
    const commenter = byId.get(p.characterId);
    const author = post && byId.get(post.characterId);
    if (post && commenter && author && commenter.worldId === author.worldId && !pausedWorlds.has(commenter.worldId)) {
      jobs.push({
        post,
        commenter,
        author,
        comment: {
          id: `cmt-auto-${post.id}-${commenter.id}`,
          characterId: commenter.id,
          authorName: commenter.name,
          authorColor: commenter.avatarColor,
          content: templateComment(commenter, author),
          time: p.time,
        },
      });
    }
    return false;
  });

  plan.decided = posts.filter((p) => decided.has(p.id)).map((p) => p.id);
  saveStoredJson(STORAGE_KEYS.snsCommentPlan, plan);
  return jobs;
}
