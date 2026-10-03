import { activeEventFor } from "@/data/events";
import { getOfflineLogOption } from "@/data/offlineLogSettings";
import { toDateKey, toTimeKey } from "@/lib/date";
import { buildTemplateEventLog } from "@/lib/eventStory";
import {
  loadStoredJson,
  saveStoredJson,
  STORAGE_KEYS,
} from "@/lib/persistence";
import { randInt } from "@/lib/random";
import type {
  ActionLog,
  CharacterProfile,
  OfflineLogFrequency,
  SleepPattern,
  StoryEvent,
  World,
} from "@/types";

/** '오프라인 정지' 세계도 접속 중에는 하루 이만큼의 슬롯으로 기록한다 */
const ONLINE_ONLY_SLOTS = 5;
/** '오프라인 정지' 세계에서 이 시간(분) 안에 지난 슬롯만 접속 중 생성으로 본다 */
const ONLINE_GRACE_MIN = 15;
/** 오랜만에 접속했을 때 캐릭터당 따라잡는 최대 슬롯 수 (API 호출량 제한) */
export const MAX_CATCH_UP = 2;

interface CharacterSlots {
  /** 오늘 기록 예정 시각 (HH:MM, 오름차순) */
  times: string[];
  /** 처리한 슬롯 수 */
  done: number;
  /** 이 계획을 세울 때의 세계 빈도. 바뀌면 다시 계획한다 */
  frequency: OfflineLogFrequency;
}

interface TimelinePlan {
  date: string;
  slots: Record<string, CharacterSlots>;
}

export interface TimelineJob {
  id: string;
  character: CharacterProfile;
  date: string;
  time: string;
  /** AI 생성이 실패하면 대신 넣을 로그 (이벤트 중일 때만) */
  fallback?: ActionLog;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function fromMinutes(min: number) {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

/** 기상 30분 뒤 ~ 취침 30분 전 (분). 자정 넘어 자면 오늘 23:59까지 */
function awakeRange(sleep: SleepPattern): [number, number] {
  const wake = toMinutes(sleep.wakeTime || "07:00");
  let bed = toMinutes(sleep.bedtime || "23:00");
  if (bed <= wake) bed = 24 * 60 - 1;
  const start = wake + 30;
  const end = bed - 30;
  return end - start >= 120 ? [start, end] : [9 * 60, 22 * 60];
}

/** 깨어 있는 시간을 count칸으로 나눠 칸마다 한 번씩 */
function slotTimes(count: number, [start, end]: [number, number]) {
  const segment = (end - start) / count;
  return Array.from({ length: count }, (_, i) =>
    fromMinutes(Math.floor(start + segment * i + randInt(0, Math.floor(segment * 0.8))))
  );
}

/**
 * AI 타임라인 기록 계획에서 시각이 지난 슬롯을 작업으로 돌려준다.
 * 슬롯은 반환 전에 처리 완료로 저장돼, AI 응답을 기다리는 동안 다시 잡히지 않는다.
 */
export function collectTimelineJobs(
  characters: CharacterProfile[],
  worlds: World[],
  events: StoryEvent[],
  logs: ActionLog[],
  now: Date
): TimelineJob[] {
  const today = toDateKey(now);
  const nowTime = toTimeKey(now);
  const stored = loadStoredJson<TimelinePlan>(STORAGE_KEYS.timelinePlan);
  const plan: TimelinePlan =
    stored && stored.date === today ? stored : { date: today, slots: {} };

  const existingIds = new Set(logs.map((l) => l.id));
  const jobs: TimelineJob[] = [];

  for (const character of characters) {
    const world = worlds.find((w) => w.id === character.worldId);
    if (!world || world.timeline.speed === 0) continue;
    const frequency = world.timeline.offlineFrequency;

    let slots = plan.slots[character.id];
    if (!slots || slots.frequency !== frequency) {
      const count = getOfflineLogOption(frequency).logsPerDay || ONLINE_ONLY_SLOTS;
      const times = slotTimes(count, awakeRange(character.sleep));
      // 빈도를 바꾼 날에는 이미 지난 슬롯을 몰아서 만들지 않는다
      const done = slots ? times.filter((t) => t <= nowTime).length : 0;
      slots = plan.slots[character.id] = { times, done, frequency };
    }

    const due: number[] = [];
    while (slots.done < slots.times.length && slots.times[slots.done] <= nowTime) {
      due.push(slots.done);
      slots.done += 1;
    }
    const picked = due
      .filter(
        (i) =>
          frequency !== "paused" ||
          toMinutes(nowTime) - toMinutes(slots.times[i]) <= ONLINE_GRACE_MIN
      )
      .slice(-MAX_CATCH_UP);
    if (picked.length === 0) continue;

    const event = activeEventFor(character, events, today);
    for (const i of picked) {
      const id = `ai-log-${today}-${character.id}-${i}`;
      if (existingIds.has(id)) continue;
      const time = slots.times[i];
      jobs.push({
        id,
        character,
        date: today,
        time,
        fallback: event
          ? buildTemplateEventLog(character, event, characters, id, today, time)
          : undefined,
      });
    }
  }

  saveStoredJson(STORAGE_KEYS.timelinePlan, plan);
  return jobs;
}
