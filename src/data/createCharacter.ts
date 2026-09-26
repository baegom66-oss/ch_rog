import type { CharacterProfile } from "@/types";

const AVATAR_COLORS = [
  "#3D6B5A",
  "#C45C26",
  "#2F5D8A",
  "#7A5C8A",
  "#8B5A2B",
  "#4A6B4E",
  "#A63D4A",
];

const EMOJIS = ["👤", "🌙", "☕", "📚", "🎵", "🌿", "✨", "🦊"];

export function createBlankCharacter(
  name: string,
  existing: CharacterProfile[]
): CharacterProfile {
  const id = `char-${Date.now()}`;
  const colorIndex = existing.length % AVATAR_COLORS.length;
  const emoji = EMOJIS[existing.length % EMOJIS.length];

  const relationships = existing.map((c) => ({
    targetId: c.id,
    tag: "모르는 사이",
    affinity: 5,
    impression: "아직 잘 모르는 사이.",
  }));

  return {
    id,
    name: name.trim(),
    age: null,
    gender: "미상",
    avatarUrl: "",
    avatarEmoji: emoji,
    avatarColor: AVATAR_COLORS[colorIndex],
    personality: "",
    toneQuotes: "",
    mbti: "ISTJ",
    alignment: "중립",
    backstory: "",
    foodPreference: "",
    likesDislikes: "",
    pets: "없음",
    subHobbies: [],
    relationships,
    locationPrefs: {
      hangouts: ["자취방"],
      interested: [],
      mobilityPattern: "동네 탐방파",
    },
    currentLocation: "자취방",
    currentAction: "새 관찰 대상이 등록됨",
    vitals: { hunger: 40, fatigue: 30, social: 40, stress: 20 },
    secretDiary: "아직 첫 비밀 일기가 없습니다.",
    wish: "",
  };
}

/** 기존 캐릭터들에 신규 캐릭터와의 관계 슬롯을 추가 */
export function withMutualRelationships(
  characters: CharacterProfile[],
  newbie: CharacterProfile
): CharacterProfile[] {
  return characters.map((c) => {
    if (c.id === newbie.id) return c;
    const has = c.relationships.some((r) => r.targetId === newbie.id);
    if (has) return c;
    return {
      ...c,
      relationships: [
        ...c.relationships,
        {
          targetId: newbie.id,
          tag: "모르는 사이",
          affinity: 5,
          impression: "새로 만난 사람. 아직 잘 모른다.",
        },
      ],
    };
  });
}
