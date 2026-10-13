import { DEFAULT_WORLD_ID } from "@/data/worlds";
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

export const initialFacilities: Facility[] = [
  {
    id: "fac-1",
    worldId: DEFAULT_WORLD_ID,
    name: "달무리 카페",
    type: "건물",
    description:
      "골목 안쪽의 작은 카페. 창가 자리가 인기이며, 딸기 타르트와 시즌 음료가 유명하다.",
    unlocked: true,
  },
  {
    id: "fac-2",
    worldId: DEFAULT_WORLD_ID,
    name: "골목 분식집 '얼큰'",
    type: "건물",
    description:
      "맵기 단계가 네 단계까지 있는 동네 분식집. 사장님이 단골 이름을 외운다.",
    unlocked: true,
  },
  {
    id: "fac-3",
    worldId: DEFAULT_WORLD_ID,
    name: "골목 헌책방",
    type: "건물",
    description:
      "좁은 서가와 구석 의자가 매력인 헌책방. 말수가 적어도 편히 머무를 수 있다.",
    unlocked: true,
  },
  {
    id: "fac-4",
    worldId: DEFAULT_WORLD_ID,
    name: "수공예 가게 '실과바늘'",
    type: "건물",
    description: "원단, 단추, 자수실을 파는 작은 가게.",
    unlocked: true,
  },
  {
    id: "fac-5",
    worldId: DEFAULT_WORLD_ID,
    name: "해안 산책 도시 '물결시'",
    type: "도시",
    description:
      "기차로 한 시간 거리의 해안 도시. 바람 부는 산책로와 해산물 포차 거리가 있다.",
    unlocked: true,
  },
  {
    id: "fac-6",
    worldId: DEFAULT_WORLD_ID,
    name: "제주 조용한 북카페 거리",
    type: "해외",
    description:
      "아직 해금되지 않은 휴양 코스. 바다가 보이는 독서 공간과 손바느질 워크숍이 있다고 소문만 무성하다.",
    unlocked: false,
  },
];
