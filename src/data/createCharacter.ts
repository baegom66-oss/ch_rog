import {
  alignTraitsToMbti,
  DEFAULT_TRAITS,
  TRAIT_DEFS,
} from "@/data/profileOptions";
import {
  emptyRelationship,
  guessRelationshipType,
} from "@/data/relationships";
import { createRandomSnsProfile } from "@/data/snsProfile";
import { DEFAULT_WORLD_ID } from "@/data/worlds";
import { randomCharacterColor } from "@/lib/color";
import type {
  Backstory,
  CharacterProfile,
  CharacterRelationship,
  CharacterWish,
  PersonalityTraits,
} from "@/types";

const EMPTY_BACKSTORY: Backstory = {
  upbringing: "",
  turningPoints: "",
  wounds: "",
  motivation: "",
};

export function createWishId(characterId: string) {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `wish-${characterId}-${suffix}`;
}

/** existing은 전체 캐릭터. 관계 슬롯은 같은 세계 캐릭터와만 만든다 */
export function createBlankCharacter(
  name: string,
  worldId: string,
  existing: CharacterProfile[]
): CharacterProfile {
  const worldmates = existing.filter((c) => c.worldId === worldId);
  return {
    id: `char-${Date.now()}`,
    worldId,
    name: name.trim(),
    age: null,
    gender: "미상",
    avatarUrl: "",
    avatarColor: randomCharacterColor(existing.map((c) => c.avatarColor)),
    personality: "",
    toneQuotes: "",
    mbti: "ISTJ",
    alignment: "중립",
    traits: alignTraitsToMbti(DEFAULT_TRAITS, "ISTJ"),
    sleep: { bedtime: "00:00", wakeTime: "08:00", note: "" },
    spending: { style: "", note: "" },
    habits: "",
    backstory: { ...EMPTY_BACKSTORY },
    foodPreference: "",
    likes: "",
    dislikes: "",
    pets: "없음",
    subHobbies: [],
    relationships: worldmates.map((c) => emptyRelationship(c.id)),
    locationPrefs: {
      hangouts: ["자취방"],
      interested: [],
      mobilityPattern: "동네 탐방파",
    },
    currentLocation: "자취방",
    currentAction: "새 관찰 대상이 등록됨",
    secretDiary: "아직 첫 비밀 일기가 없습니다.",
    wishes: [],
    sns: createRandomSnsProfile(),
  };
}

/** 신규·이주 캐릭터와 같은 세계 캐릭터들 사이에 빠진 관계 슬롯을 양방향으로 채운다 */
export function withMutualRelationships(
  characters: CharacterProfile[],
  newbie: CharacterProfile
): CharacterProfile[] {
  const worldmates = characters.filter(
    (c) => c.id !== newbie.id && c.worldId === newbie.worldId
  );
  return characters.map((c) => {
    if (c.id === newbie.id) {
      const missing = worldmates.filter(
        (m) => !c.relationships.some((r) => r.targetId === m.id)
      );
      return missing.length === 0
        ? c
        : { ...c, relationships: [...c.relationships, ...missing.map((m) => emptyRelationship(m.id))] };
    }
    return c.worldId !== newbie.worldId ||
      c.relationships.some((r) => r.targetId === newbie.id)
      ? c
      : { ...c, relationships: [...c.relationships, emptyRelationship(newbie.id)] };
  });
}

/**
 * 예전 버전 저장 형식까지 포함한 저장된 프로필
 * (생체 수치, 합쳐진 선호/기피, 문자열 과거사, type 없는 관계, 일부만 있는 성향 수치, 문자열 소원)
 */
export type StoredCharacter = Omit<
  CharacterProfile,
  | "backstory"
  | "relationships"
  | "traits"
  | "sleep"
  | "spending"
  | "habits"
  | "likes"
  | "dislikes"
  | "wishes"
  | "worldId"
> &
  Partial<
    Pick<
      CharacterProfile,
      "sleep" | "spending" | "habits" | "likes" | "dislikes" | "wishes" | "worldId"
    >
  > & {
    traits?: Partial<PersonalityTraits>;
    backstory?: Backstory | string;
    likesDislikes?: string;
    vitals?: unknown;
    avatarEmoji?: string;
    wish?: string;
    relationships: (Partial<CharacterRelationship> & { targetId: string })[];
  };

/** 새로 생긴 성향 축은 기본값으로 채우고, 예전 형식이었다면 MBTI에 맞춰 연계 수치를 정렬 */
function normalizeTraits(
  stored: Partial<PersonalityTraits> | undefined,
  mbti: string,
  defaults?: PersonalityTraits
): PersonalityTraits {
  if (!stored) return defaults ?? alignTraitsToMbti(DEFAULT_TRAITS, mbti);
  const merged = { ...DEFAULT_TRAITS, ...defaults, ...stored };
  const complete = TRAIT_DEFS.every((d) => typeof stored[d.key] === "number");
  return complete ? merged : alignTraitsToMbti(merged, mbti);
}

/** "좋아함: A / 싫어함: B" 형식이면 둘로 나누고, 아니면 전부 선호로 본다 */
function splitLikesDislikes(raw: string) {
  const match = raw.match(/좋아함\s*:\s*(.*?)\s*\/\s*싫어함\s*:\s*(.*)/);
  return match
    ? { likes: match[1].trim(), dislikes: match[2].trim() }
    : { likes: raw.trim(), dislikes: "" };
}

/**
 * LocalStorage에서 읽은 프로필을 현재 형식으로 맞춘다.
 * 새로 생긴 항목은 같은 id의 기본 캐릭터 값으로, 없으면 빈 값으로 채운다.
 */
export function normalizeCharacter(
  raw: StoredCharacter,
  today: string,
  defaults?: CharacterProfile
): CharacterProfile {
  const {
    vitals: _vitals,
    avatarEmoji: _avatarEmoji,
    likesDislikes,
    backstory,
    relationships,
    wish,
    traits,
    ...rest
  } = raw;

  const wishes: CharacterWish[] =
    raw.wishes ??
    (wish?.trim()
      ? [{ id: createWishId(raw.id), text: wish.trim(), date: today, kept: false }]
      : []);

  const preferences =
    raw.likes !== undefined
      ? { likes: raw.likes, dislikes: raw.dislikes ?? "" }
      : likesDislikes !== undefined
        ? splitLikesDislikes(likesDislikes)
        : { likes: defaults?.likes ?? "", dislikes: defaults?.dislikes ?? "" };

  const normalizedBackstory: Backstory =
    typeof backstory === "object"
      ? backstory
      : (defaults?.backstory ?? { ...EMPTY_BACKSTORY, upbringing: backstory ?? "" });

  return {
    ...rest,
    ...preferences,
    worldId: raw.worldId ?? defaults?.worldId ?? DEFAULT_WORLD_ID,
    traits: normalizeTraits(traits, raw.mbti, defaults?.traits),
    wishes,
    sleep: raw.sleep ?? defaults?.sleep ?? { bedtime: "00:00", wakeTime: "08:00", note: "" },
    spending: raw.spending ?? defaults?.spending ?? { style: "", note: "" },
    habits: raw.habits ?? defaults?.habits ?? "",
    backstory: normalizedBackstory,
    sns: raw.sns ?? defaults?.sns,
    relationships: relationships.map((r) => {
      const fallback = defaults?.relationships.find((d) => d.targetId === r.targetId);
      return {
        ...emptyRelationship(r.targetId),
        ...r,
        type: r.type ?? guessRelationshipType(r.tag ?? ""),
        description: r.description ?? fallback?.description ?? "",
      };
    }),
  };
}
