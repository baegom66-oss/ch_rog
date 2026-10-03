import {
  activeEventFor,
  eventDayIndex,
  eventDayLabel,
  eventLength,
  eventParticipants,
  eventPlace,
  eventSpotName,
  eventSpotOn,
} from "@/data/events";
import { formatMonthDay, toDateKey, toTimeKey } from "@/lib/date";
import {
  loadStoredJson,
  saveStoredJson,
  STORAGE_KEYS,
} from "@/lib/persistence";
import { pick, randInt } from "@/lib/random";
import { josa, toHashtags, toneSnippet } from "@/lib/text";
import type { ActionLog, CharacterProfile, EventFacility, StoryEvent } from "@/types";

type EventStage = "single" | "first" | "middle" | "last";

function stageOf(event: StoryEvent, dateKey: string): EventStage {
  const length = eventLength(event);
  const day = eventDayIndex(event, dateKey);
  if (length === 1) return "single";
  if (day === 1) return "first";
  if (day === length) return "last";
  return "middle";
}

interface EventScene {
  event: StoryEvent;
  stage: EventStage;
  day: number;
  dayLabel: string;
  /** 무대 안에서 오늘 머무는 전용 시설 (없으면 undefined) */
  spot?: EventFacility;
  /** 문장용 장소 (예: "이름 없는 무인도의 해변 캠프", 시설이 없으면 무대) */
  place: string;
  /** 로그 장소 칸용 (예: "이름 없는 무인도 · 해변 캠프") */
  location: string;
  companions: CharacterProfile[];
  /** "루카와 함께 " 또는 "" */
  withPhrase: string;
}

function sceneFor(
  character: CharacterProfile,
  event: StoryEvent,
  characters: CharacterProfile[],
  dateKey: string
): EventScene {
  const companions = eventParticipants(event, characters).filter((c) => c.id !== character.id);
  const names = companions.map((c) => c.name).join(", ");
  const spot = eventSpotOn(event, dateKey);
  return {
    event,
    stage: stageOf(event, dateKey),
    day: eventDayIndex(event, dateKey),
    dayLabel: eventDayLabel(event, dateKey),
    spot,
    place: eventSpotName(event, spot, "의 "),
    location: eventSpotName(event, spot),
    companions,
    withPhrase: names ? `${josa(names, "과", "와")} 함께 ` : "",
  };
}

function logSummary({ event, stage, day, spot, place, withPhrase }: EventScene) {
  const title = event.title;
  const spotScene = spot?.description.trim()
    ? [`${title} ${day}일차. ${withPhrase}${spot.name}에 들렀다. ${spot.description.trim()}`]
    : [];
  const options: Record<EventStage, string[]> = {
    single: [
      `${withPhrase}${place}에서 ${josa(title, "을", "를")} 즐겼다.`,
      `기다리던 ${title} 날. ${withPhrase}하루를 꽉 채워 보냈다.`,
    ],
    first: [
      `${place}에서 ${josa(title, "이", "가")} 시작됐다. 앞으로 ${eventLength(event)}일간의 일정.`,
      `${withPhrase}${title}의 첫날을 맞았다. 모든 게 낯설고 새롭다.`,
    ],
    middle: [
      `${title} ${day}일차. ${withPhrase}${place}에서 하루를 보냈다.`,
      `${title} ${day}일차. 계획대로 되지 않는 일도 있었지만 그것마저 이야깃거리가 됐다.`,
      ...spotScene,
    ],
    last: [
      `${title} 마지막 날. ${withPhrase}${place}에서의 시간을 천천히 정리했다.`,
      `${josa(title, "이", "가")} 끝을 향해 간다. 돌아보니 순식간이었다.`,
    ],
  };
  return pick(options[stage])!;
}

const INNER_THOUGHTS: Record<EventStage, string[]> = {
  single: ["오늘 하루는 오래 기억날 것 같다.", "끝나고 나니 벌써 또 하고 싶다."],
  first: ["설렌다. 무슨 일이 생길까.", "막상 시작하니 실감이 안 난다."],
  middle: ["벌써 익숙해진 것 같기도.", "어제보다 오늘이 조금 더 재밌다."],
  last: ["끝나는 게 조금 아쉽다.", "돌아가면 이 시간이 그리워지겠지."],
};

function buildEventLog(
  character: CharacterProfile,
  scene: EventScene,
  id: string,
  date: string,
  time: string
): ActionLog {
  const { event, dayLabel, spot, location, companions } = scene;
  const summary = logSummary(scene);
  const names = companions.map((c) => c.name);
  const period =
    event.startDate === event.endDate
      ? formatMonthDay(event.startDate)
      : `${formatMonthDay(event.startDate)} ~ ${formatMonthDay(event.endDate)}`;
  return {
    id,
    characterId: character.id,
    date,
    time,
    location,
    summary,
    innerThought: pick(INNER_THOUGHTS[scene.stage])!,
    detail: [
      `${event.emoji} ${event.title} · ${dayLabel} (${period})`,
      `무대: ${eventPlace(event)}`,
      ...(spot
        ? [`시설: ${spot.name}${spot.description.trim() ? ` — ${spot.description.trim()}` : ""}`]
        : []),
      `함께: ${names.length > 0 ? names.join(", ") : "혼자"}`,
      "",
      summary,
      ...(event.description.trim() ? ["", event.description.trim()] : []),
    ].join("\n"),
    isFavorite: false,
    companionIds: companions.map((c) => c.id),
    companionNames: names,
    placeTags: spot ? [event.title, "이벤트 전용"] : [event.title],
    contextNote: `${event.emoji} 이벤트 '${event.title}' ${dayLabel}${
      names.length > 0 ? ` · ${josa(names.join(", "), "과", "와")} 함께` : ""
    }`,
    eventId: event.id,
  };
}

/** AI 생성이 실패했을 때 대신 쓰는 템플릿 이벤트 로그 */
export function buildTemplateEventLog(
  character: CharacterProfile,
  event: StoryEvent,
  characters: CharacterProfile[],
  id: string,
  date: string,
  time: string
) {
  return buildEventLog(character, sceneFor(character, event, characters, date), id, date, time);
}

/** 이벤트 중인 캐릭터의 SNS 글. 원래 게시 계획 슬롯에 이 내용이 대신 올라간다 */
export function buildEventPost(
  character: CharacterProfile,
  event: StoryEvent,
  characters: CharacterProfile[],
  dateKey: string
) {
  const scene = sceneFor(character, event, characters, dateKey);
  const { stage, day, spot, place, withPhrase } = scene;
  const title = event.title;
  const options: Record<EventStage, string[]> = {
    single: [`오늘은 ${title}! ${place}.`, `${title} 다녀옴. 아직 여운이 남아 있음.`],
    first: [
      `${title} 시작. ${place} 도착!`,
      `드디어 ${title}. ${withPhrase ? `${withPhrase}왔다.` : "설렘 반 긴장 반."}`,
    ],
    middle: [`${title} ${day}일차. 오늘도 예상 밖의 일투성이.`, `${place}에서 보내는 ${day}일째.`],
    last: [
      `${title} 마지막 날. 벌써 끝이라니.`,
      `${title} 끝나간다. ${withPhrase || "여기서 "}보낸 시간, 기억해 둘 것.`,
    ],
  };
  const content = pick(options[stage])!;
  const tone = toneSnippet(character.toneQuotes);
  return {
    content: tone ? `${content} ${tone}` : content,
    hashtags: toHashtags([
      title,
      ...(event.location.trim() ? [event.location] : []),
      ...(spot ? [spot.name] : []),
    ]),
    eventId: event.id,
  };
}

interface EventLogPlan {
  date: string;
  /** `${eventId}:${characterId}` → 오늘 기록할 시각과 진행 여부 */
  slots: Record<string, { time: string; done: boolean }>;
}

/**
 * 이벤트에 참여 중인 캐릭터마다 하루 한 번, 계획된 시각이 지나면 이벤트 로그를 만든다.
 * 계획은 LocalStorage에 저장돼 새로고침하거나 로그를 지워도 다시 생기지 않는다.
 */
export function runEventLogs(
  characters: CharacterProfile[],
  events: StoryEvent[],
  logs: ActionLog[],
  now: Date,
  pausedWorlds: Set<string>
): ActionLog[] {
  const today = toDateKey(now);
  const nowTime = toTimeKey(now);
  const stored = loadStoredJson<EventLogPlan>(STORAGE_KEYS.eventLogPlan);
  const plan: EventLogPlan =
    stored && stored.date === today ? stored : { date: today, slots: {} };

  const existingIds = new Set(logs.map((l) => l.id));
  const generated: ActionLog[] = [];

  for (const character of characters) {
    if (pausedWorlds.has(character.worldId)) continue;
    const event = activeEventFor(character, events, today);
    if (!event) continue;
    const slot = (plan.slots[`${event.id}:${character.id}`] ??= {
      time: toTimeKey(new Date(2000, 0, 1, randInt(10, 21), randInt(0, 59))),
      done: false,
    });
    if (slot.done || slot.time > nowTime) continue;
    const id = `evt-log-${event.id}-${today}-${character.id}`;
    if (!existingIds.has(id)) {
      generated.push(buildTemplateEventLog(character, event, characters, id, today, slot.time));
    }
    slot.done = true;
  }

  saveStoredJson(STORAGE_KEYS.eventLogPlan, plan);
  return generated;
}
