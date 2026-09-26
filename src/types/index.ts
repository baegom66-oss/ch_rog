export type TabId = "timeline" | "sns" | "character" | "facility";

export type SpeedMode = 0 | 1 | 5 | 20;

/** 미접속 시 오프라인 행동 로그 생성 빈도 */
export type OfflineLogFrequency =
  | "day8"
  | "day5"
  | "day3"
  | "day1"
  | "paused";

export interface VitalStats {
  hunger: number;
  fatigue: number;
  social: number;
  stress: number;
}

/** 다른 캐릭터에 대한 관계 */
export interface CharacterRelationship {
  targetId: string;
  /** 예: 베프, 친한 지인, 안면 있음, 모르는 사이, 라이벌 */
  tag: string;
  /** 0~100 */
  affinity: number;
  /** 상대에 대한 한 줄 속마음/인식 */
  impression: string;
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
  /** 업로드·URL로 등록한 초상화. 없으면 placeholder */
  avatarUrl: string;
  avatarEmoji: string;
  avatarColor: string;
  name: string;
  /** null이면 UI에서 '미상' 표시 */
  age: number | null;
  gender: string;
  personality: string;
  toneQuotes: string;
  mbti: string;
  alignment: string;
  backstory: string;
  foodPreference: string;
  likesDislikes: string;
  pets: string;
  /** AI가 발굴하거나 유저가 추가한 하위 취미 칩 */
  subHobbies: string[];
  relationships: CharacterRelationship[];
  locationPrefs: LocationPreferences;
  currentLocation: string;
  currentAction: string;
  vitals: VitalStats;
  secretDiary: string;
  wish: string;
  /** 프로필이 마지막으로 저장된 시각 (ISO). AI는 이 이후 생성부터 최신 프로필 적용 */
  profileUpdatedAt?: string;
}

export interface ActionLog {
  id: string;
  characterId: string;
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
  time: string;
}

export interface Facility {
  id: string;
  name: string;
  type: "건물" | "도시" | "해외" | "기타";
  description: string;
  unlocked: boolean;
}
