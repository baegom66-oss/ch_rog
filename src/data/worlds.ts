import { DEFAULT_OFFLINE_LOG_FREQUENCY } from "@/data/offlineLogSettings";
import type { CharacterProfile, World, WorldTimelineSettings } from "@/types";

/** 한 세계에 살 수 있는 최대 캐릭터 수 */
export const WORLD_CHARACTER_LIMIT = 8;

/** 모든 세계를 합친 최대 캐릭터 수 */
export const TOTAL_CHARACTER_LIMIT = 30;

/** 만들 수 있는 최대 세계 수 */
export const WORLD_LIMIT = 5;

/** 세계관을 비워 두면 이 설정으로 타임라인을 만든다 */
export const DEFAULT_WORLD_LORE =
  "특별한 설정이 없는 현대 한국의 평범한 일상. 집·학교·회사·카페·편의점·지하철 같은 익숙한 장소에서 각자의 하루를 살아간다. 마법이나 초능력은 없고, 시간과 계절은 현실과 같게 흐른다.";

export const DEFAULT_WORLD_ID = "world-daily";

export const DEFAULT_TIMELINE: WorldTimelineSettings = {
  speed: 1,
  offlineFrequency: DEFAULT_OFFLINE_LOG_FREQUENCY,
};

export const WORLD_EMOJIS = ["🏘️", "🌃", "🏰", "🚀", "🌊", "🌲", "🏫", "🌸", "🌋", "🪐"];

export const initialWorlds: World[] = [
  {
    id: DEFAULT_WORLD_ID,
    name: "달무리 동네",
    emoji: "🏘️",
    lore: "",
    timeline: { ...DEFAULT_TIMELINE },
  },
];

export function createWorld(name: string, existing: World[]): World {
  return {
    id: `world-${Date.now()}`,
    name: name.trim(),
    emoji: WORLD_EMOJIS[existing.length % WORLD_EMOJIS.length],
    lore: "",
    timeline: { ...DEFAULT_TIMELINE },
  };
}

/** 타임라인 생성에 쓰는 세계관. 비어 있으면 현대 일상 */
export function worldLore(world: World): string {
  return world.lore.trim() || DEFAULT_WORLD_LORE;
}

export function charactersInWorld(characters: CharacterProfile[], worldId: string) {
  return characters.filter((c) => c.worldId === worldId);
}

export function isWorldFull(characters: CharacterProfile[], worldId: string) {
  return charactersInWorld(characters, worldId).length >= WORLD_CHARACTER_LIMIT;
}

export function isTotalCharacterFull(characters: CharacterProfile[]) {
  return characters.length >= TOTAL_CHARACTER_LIMIT;
}

/** 세계 id → 사는 캐릭터 수 */
export type WorldPopulation = Record<string, number>;

export function countByWorld(characters: CharacterProfile[]): WorldPopulation {
  const counts: WorldPopulation = {};
  for (const c of characters) counts[c.worldId] = (counts[c.worldId] ?? 0) + 1;
  return counts;
}

export function populationOf(population: WorldPopulation, worldId: string) {
  return population[worldId] ?? 0;
}

export function isPopulationFull(population: WorldPopulation, worldId: string) {
  return populationOf(population, worldId) >= WORLD_CHARACTER_LIMIT;
}

export function totalPopulation(population: WorldPopulation) {
  return Object.values(population).reduce((sum, n) => sum + n, 0);
}

/** 배속이 일시정지인 세계 id. 이 세계의 캐릭터는 시간이 흐르지 않는다 */
export function pausedWorldIds(worlds: World[]): Set<string> {
  return new Set(worlds.filter((w) => w.timeline.speed === 0).map((w) => w.id));
}
