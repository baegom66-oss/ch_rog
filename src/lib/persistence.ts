import { DEFAULT_OFFLINE_LOG_FREQUENCY } from "@/data/offlineLogSettings";
import type { CharacterProfile, OfflineLogFrequency } from "@/types";

/** 요청된 LocalStorage 키 */
export const STORAGE_KEYS = {
  offlineLogFrequency: "offlineLogFrequency",
  characterProfiles: "characterProfiles",
  selectedCharacterId: "selectedCharacterId",
} as const;

const OFFLINE_VALUES: OfflineLogFrequency[] = [
  "day8",
  "day5",
  "day3",
  "day1",
  "paused",
];

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function isOfflineLogFrequency(
  value: unknown
): value is OfflineLogFrequency {
  return (
    typeof value === "string" &&
    (OFFLINE_VALUES as string[]).includes(value)
  );
}

export function loadOfflineLogFrequency(): OfflineLogFrequency {
  if (!canUseStorage()) return DEFAULT_OFFLINE_LOG_FREQUENCY;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.offlineLogFrequency);
    if (isOfflineLogFrequency(raw)) return raw;
  } catch {
    /* private mode 등 */
  }
  return DEFAULT_OFFLINE_LOG_FREQUENCY;
}

export function saveOfflineLogFrequency(value: OfflineLogFrequency): void {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.offlineLogFrequency, value);
  } catch {
    /* quota / private mode */
  }
}

export function loadCharacterProfiles(
  fallback: CharacterProfile[]
): CharacterProfile[] {
  if (!canUseStorage()) return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.characterProfiles);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback;
    if (!parsed.every((item) => item && typeof item === "object" && "id" in item && "name" in item)) {
      return fallback;
    }
    return parsed as CharacterProfile[];
  } catch {
    return fallback;
  }
}

export function saveCharacterProfiles(profiles: CharacterProfile[]): void {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(
      STORAGE_KEYS.characterProfiles,
      JSON.stringify(profiles)
    );
  } catch {
    /* quota / private mode */
  }
}

export function loadSelectedCharacterId(
  profiles: CharacterProfile[],
  fallbackId: string
): string {
  if (!canUseStorage()) return fallbackId;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.selectedCharacterId);
    if (raw && profiles.some((p) => p.id === raw)) return raw;
  } catch {
    /* ignore */
  }
  return profiles[0]?.id ?? fallbackId;
}

export function saveSelectedCharacterId(id: string): void {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.selectedCharacterId, id);
  } catch {
    /* ignore */
  }
}
