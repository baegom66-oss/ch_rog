import type { CharacterRelationship } from "@/types";

export const RELATIONSHIP_TAG_PRESETS = [
  "베프",
  "친한 지인",
  "안면 있음",
  "모르는 사이",
  "라이벌",
  "연인",
  "가족",
  "선후배",
] as const;

export const MOBILITY_PATTERN_PRESETS = [
  "집돌이/집순이",
  "동네 탐방파",
  "핫플 추적파",
  "루틴형 단골파",
  "즉흥 방황파",
] as const;

export function emptyRelationship(
  targetId: string
): CharacterRelationship {
  return {
    targetId,
    tag: "모르는 사이",
    affinity: 0,
    impression: "",
  };
}
