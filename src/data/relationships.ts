import type {
  CharacterProfile,
  CharacterRelationship,
  RelationshipType,
} from "@/types";

export const RELATIONSHIP_TYPES: {
  type: RelationshipType;
  label: string;
  /** 관계도 선 색. null이면 선을 그리지 않음 */
  color: string | null;
  tagPresets: string[];
}[] = [
  {
    type: "stranger",
    label: "모르는 사이",
    color: null,
    tagPresets: ["모르는 사이", "얼굴만 앎"],
  },
  {
    type: "acquaintance",
    label: "지인",
    color: "#22A06B",
    tagPresets: ["안면 있음", "친한 지인", "동네 이웃", "단골 동지", "선후배"],
  },
  {
    type: "friend",
    label: "친구",
    color: "#E5B700",
    tagPresets: ["친구", "베프", "소꿉친구", "라이벌", "동창"],
  },
  {
    type: "lover",
    label: "연인",
    color: "#EC4899",
    tagPresets: ["연인", "썸", "배우자", "짝사랑"],
  },
  {
    type: "family",
    label: "가족",
    color: "#38BDF8",
    tagPresets: ["형제", "남매", "자매", "부모·자식", "사촌"],
  },
];

export function getRelationshipType(type: RelationshipType) {
  return RELATIONSHIP_TYPES.find((t) => t.type === type) ?? RELATIONSHIP_TYPES[0];
}

export function emptyRelationship(targetId: string): CharacterRelationship {
  return {
    targetId,
    type: "stranger",
    tag: "모르는 사이",
    affinity: 0,
    impression: "",
    description: "",
  };
}

export function findRelationship(
  from: CharacterProfile,
  targetId: string
): CharacterRelationship {
  return (
    from.relationships.find((r) => r.targetId === targetId) ??
    emptyRelationship(targetId)
  );
}

/** 예전 저장분(type 없이 tag만 있던 관계)의 분류를 tag로 추정 */
export function guessRelationshipType(tag: string): RelationshipType {
  if (/연인|애인|썸|배우자/.test(tag)) return "lover";
  if (/가족|형제|남매|자매|부모|사촌/.test(tag)) return "family";
  if (/베프|친구|절친|소꿉|라이벌/.test(tag)) return "friend";
  if (/모르는/.test(tag) || tag.trim() === "") return "stranger";
  return "acquaintance";
}

function upsert(
  list: CharacterRelationship[],
  rel: CharacterRelationship
): CharacterRelationship[] {
  return list.some((r) => r.targetId === rel.targetId)
    ? list.map((r) => (r.targetId === rel.targetId ? rel : r))
    : [...list, rel];
}

/**
 * fromId 캐릭터의 관계를 저장하고, 상대 쪽 관계의 분류·설명도 같은 값으로 맞춘다.
 * 친밀도·속마음·호칭은 각자의 시점이므로 상대 쪽 값은 건드리지 않는다.
 */
export function setMutualRelationship(
  characters: CharacterProfile[],
  fromId: string,
  rel: CharacterRelationship
): CharacterProfile[] {
  return characters.map((c) => {
    if (c.id === fromId) {
      return { ...c, relationships: upsert(c.relationships, rel) };
    }
    if (c.id === rel.targetId) {
      const back = findRelationship(c, fromId);
      return {
        ...c,
        relationships: upsert(c.relationships, {
          ...back,
          type: rel.type,
          description: rel.description,
          tag: back.type === rel.type ? back.tag : getRelationshipType(rel.type).tagPresets[0],
        }),
      };
    }
    return c;
  });
}
