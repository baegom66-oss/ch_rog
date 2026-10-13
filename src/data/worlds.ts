import { DEFAULT_OFFLINE_LOG_FREQUENCY } from "@/data/offlineLogSettings";
import type { CharacterProfile, FacilityType, World, WorldTimelineSettings } from "@/types";

/** 한 세계에 살 수 있는 최대 캐릭터 수 */
export const WORLD_CHARACTER_LIMIT = 8;

/** 모든 세계를 합친 최대 캐릭터 수 */
export const TOTAL_CHARACTER_LIMIT = 30;

/** 만들 수 있는 최대 세계 수 */
export const WORLD_LIMIT = 5;

/** 세계관을 비워 두면 이 설정으로 타임라인을 만든다 */
export const DEFAULT_WORLD_LORE =
  "특별한 설정이 없는 현대 한국의 평범한 일상. 집·학교·회사·카페·편의점·지하철 같은 익숙한 장소에서 각자의 하루를 살아간다. 마법이나 초능력은 없고, 시간과 계절은 현실과 같게 흐른다.";

/** 예전 기본 세계 id. 손대지 않은 시작 데이터면 불러올 때 비운다 */
export const DEFAULT_WORLD_ID = "world-daily";

export const DEFAULT_TIMELINE: WorldTimelineSettings = {
  speed: 1,
  offlineFrequency: DEFAULT_OFFLINE_LOG_FREQUENCY,
};

export const WORLD_EMOJIS = ["🏘️", "🌃", "🏰", "🚀", "🌊", "🌲", "🏫", "🌸", "🌋", "🪐"];

/** 처음에는 세계가 없다. 유저가 직접 만든다 */
export const initialWorlds: World[] = [];

/** 보기 전용 가이드. 저장되지 않고, 캐릭터가 살지 않는다 */
export const GUIDE_WORLD_ID = "world-guide";

export const GUIDE_WORLD: World = {
  id: GUIDE_WORLD_ID,
  name: "현대 한국",
  emoji: "🇰🇷",
  lore: DEFAULT_WORLD_LORE,
  timeline: { ...DEFAULT_TIMELINE },
};

export const GUIDE_PLACES: { name: string; type: FacilityType; description: string }[] = [
  {
    name: "집",
    type: "건물",
    description: "하루가 시작하고 끝나는 곳. 아침 준비, 늦은 귀가, 혼자 있는 시간이 여기에 쌓인다.",
  },
  {
    name: "학교",
    type: "건물",
    description: "수업, 동아리, 급식, 하교길. 학생 캐릭터의 낮 시간이 머무는 곳.",
  },
  {
    name: "회사",
    type: "건물",
    description: "출퇴근과 야근, 팀 점심. 직장인 캐릭터의 평일 루틴이 된다.",
  },
  {
    name: "카페",
    type: "건물",
    description: "약속 장소이거나, 혼자 앉아 시간을 보내는 단골 자리.",
  },
  {
    name: "편의점",
    type: "건물",
    description: "밤늦게 들르거나, 잠깐 뭔가 사 가는 일상적인 경유지.",
  },
  {
    name: "지하철",
    type: "기타",
    description: "출퇴근과 약속 이동. 같은 세계 캐릭터와 우연히 마주칠 수 있는 길.",
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
