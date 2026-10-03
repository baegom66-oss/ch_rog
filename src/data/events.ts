import { addDays, daysBetween } from "@/lib/date";
import type { CharacterProfile, EventFacility, StoryEvent } from "@/types";

export const EVENT_EMOJIS = ["🎉", "✈️", "🎤", "💘", "🏝️", "🏕️", "🎬", "🎓", "🍽️", "🎮", "🏆", "🌌"];

/** 이벤트 하나에 만들 수 있는 전용 시설 수 */
export const EVENT_FACILITY_LIMIT = 10;

type FacilityDraft = Omit<EventFacility, "id">;

export interface EventPreset {
  emoji: string;
  title: string;
  location: string;
  description: string;
  days: number;
  facilities: FacilityDraft[];
}

/** 새 이벤트를 만들 때 고를 수 있는 예시 */
export const EVENT_PRESETS: EventPreset[] = [
  {
    emoji: "✈️",
    title: "유럽 여행",
    location: "유럽",
    description:
      "함께 유럽으로 떠난 여행. 낯선 거리와 음식, 길을 잃는 해프닝까지 모두 여행의 일부다. 도시를 옮겨 다니며 매일 새로운 풍경을 만난다.",
    days: 7,
    facilities: [
      { name: "에펠탑", type: "기타", description: "파리의 상징. 해 질 녘 반짝이는 조명을 보려는 사람들로 붐빈다." },
      { name: "콜로세움", type: "건물", description: "로마의 원형 경기장. 돌계단마다 오래된 이야기가 배어 있다." },
      { name: "보케리아 시장", type: "건물", description: "바르셀로나의 시장. 과일 주스와 하몽 냄새가 가득하다." },
    ],
  },
  {
    emoji: "🎤",
    title: "콘서트 관람",
    location: "올림픽 체조경기장",
    description:
      "좋아하는 가수의 콘서트를 보러 간 날. 굿즈 줄 서기, 떼창, 끝나고도 한참 남는 여운.",
    days: 1,
    facilities: [
      { name: "굿즈 부스", type: "건물", description: "공연 몇 시간 전부터 줄이 늘어서는 곳. 응원봉은 금방 품절된다." },
      { name: "스탠딩 구역", type: "건물", description: "무대와 가장 가까운 자리. 떼창과 함성이 쏟아진다." },
    ],
  },
  {
    emoji: "💘",
    title: "연애 프로그램 출연",
    location: "남해 바닷가 마을",
    description:
      "카메라가 24시간 돌아가는 연애 리얼리티에 출연했다. 첫인상 선택, 데이트 상대 고르기, 엇갈리는 마음과 속마음 인터뷰.",
    days: 5,
    facilities: [
      { name: "셰어하우스 거실", type: "건물", description: "출연자들이 모여 저녁을 먹고 대화를 나누는 공간. 어딜 가도 카메라가 있다." },
      { name: "속마음 인터뷰룸", type: "건물", description: "혼자 들어가 카메라 앞에서 솔직한 마음을 털어놓는 작은 방." },
      { name: "바닷가 데이트 코스", type: "기타", description: "선택받은 두 사람만 갈 수 있는 해변 산책로." },
    ],
  },
  {
    emoji: "🏝️",
    title: "무인도 탈출",
    location: "이름 없는 무인도",
    description:
      "배가 고장 나 무인도에 표류했다. 마실 물과 불을 구하고, 구조 신호를 만들며 섬을 빠져나갈 방법을 찾아야 한다.",
    days: 3,
    facilities: [
      { name: "해변 캠프", type: "기타", description: "표류한 첫날 만든 임시 거처. 모닥불 자리와 나뭇잎 지붕이 전부다." },
      { name: "정글 숲", type: "기타", description: "열매와 물을 구할 수 있지만 길을 잃기 쉬운 울창한 숲." },
      { name: "절벽 위 신호대", type: "기타", description: "지나가는 배에 구조 신호를 보내기 좋은 섬의 가장 높은 곳." },
    ],
  },
];

export type EventStatus = "upcoming" | "ongoing" | "ended";

export type EventPeriod = Pick<StoryEvent, "startDate" | "endDate">;

export function eventStatus(event: EventPeriod, today: string): EventStatus {
  if (today < event.startDate) return "upcoming";
  if (today > event.endDate) return "ended";
  return "ongoing";
}

/** 기간 일수 (시작일·종료일 포함) */
export function eventLength(event: EventPeriod) {
  return daysBetween(event.startDate, event.endDate) + 1;
}

/** 이벤트 몇 일차인지 (1부터) */
export function eventDayIndex(event: EventPeriod, dateKey: string) {
  return daysBetween(event.startDate, dateKey) + 1;
}

/** "당일" · "첫째 날" · "3일차" · "마지막 날" */
export function eventDayLabel(event: EventPeriod, dateKey: string) {
  const length = eventLength(event);
  const day = eventDayIndex(event, dateKey);
  if (length === 1) return "당일";
  if (day === 1) return "첫째 날";
  if (day === length) return "마지막 날";
  return `${day}일차`;
}

function periodsOverlap(a: EventPeriod, b: EventPeriod) {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

/** 이벤트의 무대(넓은 배경). 비워 두면 이벤트 이름 */
export function eventPlace(event: StoryEvent) {
  return event.location.trim() || event.title;
}

/**
 * 무대 안의 시설까지 붙인 장소 이름.
 * joiner로 잇는다 (예: " · " → "이름 없는 무인도 · 해변 캠프", "의 " → "이름 없는 무인도의 해변 캠프").
 * 무대를 비웠으면 시설 이름만, 시설이 없으면 무대만.
 */
export function eventSpotName(event: StoryEvent, spot: EventFacility | undefined, joiner = " · ") {
  if (!spot) return eventPlace(event);
  const stage = event.location.trim();
  return stage ? `${stage}${joiner}${spot.name}` : spot.name;
}

/** 무대 안에서, 그날 참여 캐릭터들이 함께 머무는 전용 시설. 같은 날이면 누구에게나 같은 곳 */
export function eventSpotOn(event: StoryEvent, dateKey: string): EventFacility | undefined {
  if (event.facilities.length === 0) return undefined;
  let hash = 0;
  for (const ch of `${event.id}:${dateKey}`) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return event.facilities[hash % event.facilities.length];
}

/** 지금 그 세계에 사는 참여 캐릭터 (다른 세계로 떠난 캐릭터는 빠진다) */
export function eventParticipants(event: StoryEvent, characters: CharacterProfile[]) {
  return characters.filter(
    (c) => c.worldId === event.worldId && event.participantIds.includes(c.id)
  );
}

/** 같은 기간에 이 캐릭터가 이미 참여 중인 다른 이벤트 (한 캐릭터는 한 번에 하나만) */
export function findConflictingEvent(
  characterId: string,
  period: EventPeriod,
  events: StoryEvent[],
  excludeId?: string
) {
  return events.find(
    (e) =>
      e.id !== excludeId &&
      e.participantIds.includes(characterId) &&
      periodsOverlap(e, period)
  );
}

/** 오늘 이 캐릭터가 참여 중인 이벤트 */
export function activeEventFor(
  character: CharacterProfile,
  events: StoryEvent[],
  dateKey: string
) {
  return events.find(
    (e) =>
      e.worldId === character.worldId &&
      e.participantIds.includes(character.id) &&
      eventStatus(e, dateKey) === "ongoing"
  );
}

export type EventDraft = Omit<StoryEvent, "id" | "worldId">;

export function blankEventDraft(today: string): EventDraft {
  return {
    emoji: EVENT_EMOJIS[0],
    title: "",
    description: "",
    location: "",
    participantIds: [],
    startDate: today,
    endDate: addDays(today, 2),
    facilities: [],
  };
}

export function applyPreset(draft: EventDraft, preset: EventPreset): EventDraft {
  return {
    ...draft,
    emoji: preset.emoji,
    title: preset.title,
    location: preset.location,
    description: preset.description,
    endDate: addDays(draft.startDate, preset.days - 1),
    facilities: preset.facilities.map((f) => ({ ...f, id: createEventFacilityId() })),
  };
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6);
}

export function createEventId() {
  return `evt-${Date.now()}-${randomSuffix()}`;
}

export function createEventFacilityId() {
  return `evt-fac-${Date.now()}-${randomSuffix()}`;
}

/** 전용 시설이 생기기 전에 저장된 이벤트도 읽을 수 있게 */
export function normalizeEvent(event: StoryEvent): StoryEvent {
  return { ...event, facilities: Array.isArray(event.facilities) ? event.facilities : [] };
}

/** 내용·기간은 그대로, 참여 캐릭터는 그 세계에서 새로 고르도록 비워서 복사 */
export function copyEventToWorld(event: StoryEvent, worldId: string): StoryEvent {
  return { ...event, id: createEventId(), worldId, participantIds: [] };
}
