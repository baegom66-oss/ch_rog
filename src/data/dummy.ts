import type {
  ActionLog,
  CharacterProfile,
  Facility,
  ScheduleItem,
  SnsPost,
} from "@/types";

export const FAVORITE_SLOT_MAX = 20;
/** 타임라인 로그 최대 보관 수 (전체 세계 합산, 보관함 로그 포함) */
export const FEED_LOG_LIMIT = 70;
/** 캐릭터 1명당 SNS 게시물 최대 보관 수 (즐겨찾기 포함) */
export const SNS_POST_LIMIT = 10;
/** 캐릭터 1명당 SNS 즐겨찾기 최대 수. 가득 차면 새 게시물이 올라오지 않는다 */
export const SNS_FAVORITE_MAX = 10;

/** 처음 열면 캐릭터가 없다. 유저가 직접 만든다. */
export const initialCharacters: CharacterProfile[] = [];

export const initialLogs: ActionLog[] = [];

export const initialSchedules: ScheduleItem[] = [];

export const initialSnsPosts: SnsPost[] = [];

/** 처음에는 장소도 없다. 세계마다 유저가 직접 추가한다 */
export const initialFacilities: Facility[] = [];
