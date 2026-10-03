import {
  normalizeCharacter,
  type StoredCharacter,
} from "@/data/createCharacter";
import {
  DEFAULT_OFFLINE_LOG_FREQUENCY,
  isOfflineLogFrequency,
} from "@/data/offlineLogSettings";
import { normalizeEvent } from "@/data/events";
import { DEFAULT_TIMELINE, DEFAULT_WORLD_ID } from "@/data/worlds";
import { toDateKey } from "@/lib/date";
import { DEFAULT_GEMINI_MODEL } from "@/lib/gemini";
import type {
  AiSettings,
  CharacterProfile,
  Facility,
  OfflineLogFrequency,
  SnsPost,
  StoryEvent,
  World,
} from "@/types";

export const STORAGE_KEYS = {
  /** 세계 도입 전 전역 오프라인 설정 (기본 세계로 옮겨 쓰기만 함) */
  offlineLogFrequency: "offlineLogFrequency",
  worlds: "worlds",
  selectedWorldId: "selectedWorldId",
  characterProfiles: "characterProfiles",
  selectedCharacterId: "selectedCharacterId",
  actionLogs: "actionLogs",
  schedules: "schedules",
  facilities: "facilities",
  snsPosts: "snsPosts",
  snsAutoPostEnabled: "snsAutoPostEnabled",
  snsAutoPostPlan: "snsAutoPostPlan",
  wishRollDate: "wishRollDate",
  events: "storyEvents",
  eventLogPlan: "eventLogPlan",
  aiSettings: "aiSettings",
  timelinePlan: "timelinePlan",
  snsCommentPlan: "snsCommentPlan",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/* private mode·quota 초과 등 저장소 오류는 모두 무시하고 기본값으로 동작 */

function readString(key: StorageKey): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeString(key: StorageKey, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function loadStoredJson<T>(key: StorageKey): T | null {
  const raw = readString(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveStoredJson(key: StorageKey, value: unknown): void {
  writeString(key, JSON.stringify(value));
}

/** 저장된 배열이 없거나 형식이 깨졌으면 fallback */
export function loadStoredList<T>(key: StorageKey, fallback: T[]): T[] {
  const parsed = loadStoredJson<unknown>(key);
  return Array.isArray(parsed) ? (parsed as T[]) : fallback;
}

function loadLegacyOfflineLogFrequency(): OfflineLogFrequency {
  const raw = readString(STORAGE_KEYS.offlineLogFrequency);
  return isOfflineLogFrequency(raw) ? raw : DEFAULT_OFFLINE_LOG_FREQUENCY;
}

/** 저장된 세계가 없으면 기본 세계를 쓰되, 예전 전역 오프라인 설정을 이어받는다 */
export function loadWorlds(fallback: World[]): World[] {
  const parsed = loadStoredList<World>(STORAGE_KEYS.worlds, []);
  if (parsed.length > 0) {
    return parsed.map((w) => ({ ...w, timeline: { ...DEFAULT_TIMELINE, ...w.timeline } }));
  }
  const offlineFrequency = loadLegacyOfflineLogFrequency();
  return fallback.map((w) =>
    w.id === DEFAULT_WORLD_ID ? { ...w, timeline: { ...w.timeline, offlineFrequency } } : w
  );
}

/** 저장된 세계가 없으면 선택된 캐릭터가 사는 세계 */
export function loadSelectedWorldId(
  worlds: World[],
  characters: CharacterProfile[],
  selectedCharacterId: string
): string {
  const raw = readString(STORAGE_KEYS.selectedWorldId);
  if (worlds.some((w) => w.id === raw)) return raw!;
  const owner = characters.find((c) => c.id === selectedCharacterId)?.worldId;
  return worlds.some((w) => w.id === owner) ? owner! : worlds[0].id;
}

export function saveSelectedWorldId(id: string): void {
  writeString(STORAGE_KEYS.selectedWorldId, id);
}

/** 세계 도입 전 시설은 기본 세계에 둔다 */
export function loadFacilities(fallback: Facility[]): Facility[] {
  return loadStoredList(STORAGE_KEYS.facilities, fallback).map((f) =>
    f.worldId ? f : { ...f, worldId: DEFAULT_WORLD_ID }
  );
}

export function loadCharacterProfiles(
  fallback: CharacterProfile[]
): CharacterProfile[] {
  const parsed = loadStoredList<StoredCharacter>(
    STORAGE_KEYS.characterProfiles,
    []
  );
  const valid =
    parsed.length > 0 &&
    parsed.every((p) => p && typeof p === "object" && "id" in p && "name" in p);
  if (!valid) return fallback;
  const today = toDateKey(new Date());
  return parsed.map((p) =>
    normalizeCharacter(p, today, fallback.find((f) => f.id === p.id))
  );
}

export function loadSelectedCharacterId(profiles: CharacterProfile[]): string {
  const raw = readString(STORAGE_KEYS.selectedCharacterId);
  return profiles.some((p) => p.id === raw) ? raw! : (profiles[0]?.id ?? "");
}

export function saveSelectedCharacterId(id: string): void {
  writeString(STORAGE_KEYS.selectedCharacterId, id);
}

/** 날짜가 없는 게시물(기본 데이터·예전 저장분)은 처음 불러온 날 게시된 것으로 본다 */
export function loadSnsPosts(fallback: SnsPost[], today: string): SnsPost[] {
  return loadStoredList(STORAGE_KEYS.snsPosts, fallback).map((p) =>
    p.date ? p : { ...p, date: today }
  );
}

export function loadAiSettings(): AiSettings {
  const stored = loadStoredJson<Partial<AiSettings>>(STORAGE_KEYS.aiSettings);
  return {
    apiKey: typeof stored?.apiKey === "string" ? stored.apiKey : "",
    model: typeof stored?.model === "string" && stored.model ? stored.model : DEFAULT_GEMINI_MODEL,
    enabled: stored?.enabled !== false,
  };
}

export function loadEvents(): StoryEvent[] {
  return loadStoredList<StoryEvent>(STORAGE_KEYS.events, []).map(normalizeEvent);
}

export function loadSnsAutoPostEnabled(): boolean {
  return readString(STORAGE_KEYS.snsAutoPostEnabled) !== "false";
}

export function saveSnsAutoPostEnabled(enabled: boolean): void {
  writeString(STORAGE_KEYS.snsAutoPostEnabled, String(enabled));
}

/** 오늘의 소원 확률 추첨을 마지막으로 한 날짜 (YYYY-MM-DD) */
export function loadWishRollDate(): string | null {
  return readString(STORAGE_KEYS.wishRollDate);
}

export function saveWishRollDate(date: string): void {
  writeString(STORAGE_KEYS.wishRollDate, date);
}
