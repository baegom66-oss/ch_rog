export type TabId = "timeline" | "sns" | "character" | "event" | "world";

/** 타임라인 피드 필터: 전체 또는 특정 캐릭터 id */
export type TimelineFilter = "all" | string;

export type SpeedMode = 0 | 1 | 5 | 20;

/** 미접속 시 오프라인 행동 로그 생성 빈도 */
export type OfflineLogFrequency =
  | "day8"
  | "day5"
  | "day3"
  | "day1"
  | "paused";

/** 세계마다 따로 정하는 타임라인 설정 */
export interface WorldTimelineSettings {
  speed: SpeedMode;
  offlineFrequency: OfflineLogFrequency;
}

/** 캐릭터들이 살아가는 세계. 같은 세계의 캐릭터끼리만 서로를 인식한다 */
export interface World {
  id: string;
  name: string;
  emoji: string;
  /** 유저가 작성한 세계관. 비어 있으면 현대 일상 기준 */
  lore: string;
  timeline: WorldTimelineSettings;
}

/** Gemini 연동 설정. 이 브라우저에만 저장된다 */
export interface AiSettings {
  /** Google AI Studio에서 발급받은 키 */
  apiKey: string;
  model: string;
  /** 키를 지우지 않고 AI 생성만 잠시 끌 때 false */
  enabled: boolean;
}

/** AI 생성 진행 상황 (저장하지 않음) */
export interface AiStatus {
  /** 응답을 기다리는 요청 수 */
  pending: number;
  /** ISO 시각 */
  lastSuccessAt?: string;
  lastError?: { message: string; at: string };
}

/** 유저가 만든 이벤트. 기간 동안 참여 캐릭터의 타임라인·SNS가 이 이벤트를 따라 작성된다 */
export interface StoryEvent {
  id: string;
  /** 이벤트가 열리는 세계. 이 세계에 사는 캐릭터만 참여할 수 있다 */
  worldId: string;
  emoji: string;
  title: string;
  /** 어떤 이벤트인지 유저가 작성한 설명 */
  description: string;
  /** 이벤트 무대. 비우면 이벤트 이름으로 대신한다 */
  location: string;
  participantIds: string[];
  /** YYYY-MM-DD, 시작일과 종료일 모두 포함 */
  startDate: string;
  endDate: string;
  /** 이벤트 기간에만 존재하는 전용 시설 */
  facilities: EventFacility[];
}

export type FacilityType = "건물" | "도시" | "해외" | "기타";

/** 이벤트 전용 시설. 이벤트에 속해 함께 복사·삭제된다 */
export interface EventFacility {
  id: string;
  name: string;
  type: FacilityType;
  description: string;
}

/** 관계도 선 색을 정하는 관계 분류 */
export type RelationshipType =
  | "stranger"
  | "acquaintance"
  | "friend"
  | "lover"
  | "family";

/** 다른 캐릭터에 대한 관계. type·description은 두 캐릭터가 같은 값을 공유한다 */
export interface CharacterRelationship {
  targetId: string;
  type: RelationshipType;
  /** 세부 호칭 (예: 베프, 소꿉친구, 사촌, 라이벌) */
  tag: string;
  /** 0~100 */
  affinity: number;
  /** 상대에 대한 한 줄 속마음/인식 */
  impression: string;
  /** 어떻게 알게 됐는지, 지금 어떤 관계인지 */
  description: string;
}

/** 0~100 성향 수치. 0이 왼쪽 성향, 100이 오른쪽 성향 */
export interface PersonalityTraits {
  /** MBTI E/I */
  sociability: number;
  /** MBTI S/N */
  imagination: number;
  /** MBTI T/F */
  empathy: number;
  /** MBTI J/P */
  planning: number;
  expressiveness: number;
  sensitivity: number;
  /** 체력·활동량 */
  energy: number;
}

export interface CharacterWish {
  id: string;
  text: string;
  /** 소원이 생긴 날짜 (YYYY-MM-DD). 간직하지 않으면 이 날 자정이 지나면 사라진다 */
  date: string;
  /** 유저가 체크하면 이룰 때까지 유지 */
  kept: boolean;
}

export interface SleepPattern {
  /** HH:MM */
  bedtime: string;
  /** HH:MM */
  wakeTime: string;
  note: string;
}

export interface SpendingPattern {
  style: string;
  note: string;
}

export interface Backstory {
  upbringing: string;
  turningPoints: string;
  wounds: string;
  motivation: string;
}

export interface LocationPreferences {
  /** 단골 장소(아지트) */
  hangouts: string[];
  /** 미개척 / 관심 장소 */
  interested: string[];
  /** 동선 패턴 성향 */
  mobilityPattern: string;
}

export interface CharacterProfile {
  id: string;
  /** 살고 있는 세계 */
  worldId: string;
  /** 업로드·URL로 등록한 초상화. 없으면 placeholder */
  avatarUrl: string;
  /** 대표 색상. 사진이 없으면 프로필 배경이 되고, 사진이 있어도 캐릭터 UI 강조색으로 쓴다 */
  avatarColor: string;
  name: string;
  /** null이면 UI에서 '미상' 표시 */
  age: number | null;
  gender: string;
  personality: string;
  toneQuotes: string;
  mbti: string;
  alignment: string;
  traits: PersonalityTraits;
  sleep: SleepPattern;
  spending: SpendingPattern;
  habits: string;
  backstory: Backstory;
  foodPreference: string;
  likes: string;
  dislikes: string;
  pets: string;
  /** AI가 발굴하거나 유저가 추가한 하위 취미 칩 */
  subHobbies: string[];
  relationships: CharacterRelationship[];
  locationPrefs: LocationPreferences;
  currentLocation: string;
  currentAction: string;
  secretDiary: string;
  wishes: CharacterWish[];
  /** 프로필이 마지막으로 저장된 시각 (ISO). AI는 이 이후 생성부터 최신 프로필 적용 */
  profileUpdatedAt?: string;
  /** SNS 프로필 (가상 팔로워/팔로잉, 소개). 없으면 id 기반 기본값 */
  sns?: SnsProfile;
}

export interface SnsProfile {
  followers: number;
  following: number;
  bio: string;
}

export interface ActionLog {
  id: string;
  characterId: string;
  /** 기록 날짜 (YYYY-MM-DD). 예전 기본 데이터에는 없다 */
  date?: string;
  time: string;
  location: string;
  summary: string;
  innerThought: string;
  detail: string;
  isFavorite: boolean;
  /** 함께한 캐릭터 id */
  companionIds?: string[];
  /** 함께한 캐릭터 표시명 (스냅샷) */
  companionNames?: string[];
  /** 장소 맥락 태그 */
  placeTags?: string[];
  /** 카드/모달용 관계·동선 연출 문구 */
  contextNote?: string;
  /** 이벤트 영향으로 작성된 로그면 그 이벤트 id */
  eventId?: string;
}

export interface ScheduleItem {
  id: string;
  characterId: string;
  time: string;
  title: string;
  location: string;
}

export interface SnsComment {
  id: string;
  characterId: string;
  authorName: string;
  authorColor: string;
  content: string;
  time: string;
}

export interface SnsPost {
  id: string;
  characterId: string;
  authorName: string;
  authorColor: string;
  content: string;
  hashtags: string[];
  /** 업로드·URL 이미지. 없으면 글만 게시 */
  imageUrl?: string;
  likes: number;
  reactions: string[];
  comments: SnsComment[];
  /** 게시 날짜 (YYYY-MM-DD) */
  date?: string;
  time: string;
  /** 다른 게시물을 공유한 글이면 원본 게시물 id */
  sharedPostId?: string;
  /** 이벤트 영향으로 작성된 글이면 그 이벤트 id */
  eventId?: string;
  /** 즐겨찾기한 글은 보관 한도를 넘어도 지워지지 않는다 */
  isFavorite?: boolean;
}

export interface Facility {
  id: string;
  /** 이 장소가 존재하는 세계 */
  worldId: string;
  name: string;
  type: FacilityType;
  description: string;
  unlocked: boolean;
}
