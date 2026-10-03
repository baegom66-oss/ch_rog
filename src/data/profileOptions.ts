import type { PersonalityTraits } from "@/types";

export const MBTI_OPTIONS = [
  "ISTJ",
  "ISFJ",
  "INFJ",
  "INTJ",
  "ISTP",
  "ISFP",
  "INFP",
  "INTP",
  "ESTP",
  "ESFP",
  "ENFP",
  "ENTP",
  "ESTJ",
  "ESFJ",
  "ENFJ",
  "ENTJ",
];

export const ALIGNMENT_OPTIONS = [
  "질서 선",
  "중립 선",
  "혼돈 선",
  "질서 중립",
  "중립",
  "혼돈 중립",
  "질서 악",
  "중립 악",
  "혼돈 악",
];

export const GENDER_PRESETS = ["남성", "여성", "논바이너리", "기타", "미상"];

export interface TraitDef {
  key: keyof PersonalityTraits;
  label: string;
  low: string;
  high: string;
  hint: string;
  /** MBTI와 연계되는 축이면 해당 글자 위치와 양 끝 글자 */
  mbti?: { index: number; low: string; high: string };
}

export const TRAIT_DEFS: TraitDef[] = [
  {
    key: "sociability",
    label: "사회성",
    low: "혼자가 편함",
    high: "사람이 좋음",
    hint: "약속을 잡는 빈도, 혼자 보내는 시간, 먼저 말을 거는지 여부에 반영됩니다.",
    mbti: { index: 0, low: "I", high: "E" },
  },
  {
    key: "imagination",
    label: "상상력",
    low: "현실적",
    high: "상상력 풍부",
    hint: "익숙한 것과 새로운 것 중 무엇을 고르는지, 대화가 사실 위주인지 공상 위주인지에 반영됩니다.",
    mbti: { index: 1, low: "S", high: "N" },
  },
  {
    key: "empathy",
    label: "판단 기준",
    low: "논리 우선",
    high: "감정 우선",
    hint: "고민·갈등 상황에서 사실과 효율을 따지는지, 사람의 마음을 먼저 살피는지에 반영됩니다.",
    mbti: { index: 2, low: "T", high: "F" },
  },
  {
    key: "planning",
    label: "계획성",
    low: "즉흥적",
    high: "계획적",
    hint: "하루 일정이 루틴대로 흘러가는지, 즉흥적으로 바뀌는지에 반영됩니다.",
    mbti: { index: 3, low: "P", high: "J" },
  },
  {
    key: "expressiveness",
    label: "감정 표현",
    low: "속으로 삼킴",
    high: "바로 드러냄",
    hint: "대사·SNS 글에서 감정을 얼마나 직접적으로 말하는지에 반영됩니다.",
  },
  {
    key: "sensitivity",
    label: "예민도",
    low: "무던함",
    high: "예민함",
    hint: "소음·사람 밀도·작은 말에 얼마나 크게 반응하는지에 반영됩니다.",
  },
  {
    key: "energy",
    label: "에너지",
    low: "금방 지침",
    high: "에너지 넘침",
    hint: "하루 활동량, 외출 횟수, 일정 사이 쉬는 시간, 밤에 지친 기색에 반영됩니다. 사회성(E/I)과는 별개로 체력 자체를 뜻합니다.",
  },
];

export const DEFAULT_TRAITS: PersonalityTraits = {
  sociability: 50,
  imagination: 50,
  empathy: 50,
  planning: 50,
  expressiveness: 50,
  sensitivity: 50,
  energy: 50,
};

const MBTI_PATTERN = /^[EI][SN][TF][JP]$/;

/** 정확한 네 글자 MBTI면 대문자로, 아니면 null */
function parseMbti(value: string): string | null {
  const code = value.trim().toUpperCase();
  return MBTI_PATTERN.test(code) ? code : null;
}

/** 중간값(50)인 축을 MBTI 쪽으로 밀 때의 거리 */
const MBTI_NUDGE = 15;

/**
 * MBTI 글자에 맞춰 연계 수치를 옮긴다.
 * 이미 맞는 쪽이면 그대로 두고, 반대쪽이면 같은 강도로 뒤집는다.
 */
export function alignTraitsToMbti(
  traits: PersonalityTraits,
  mbti: string
): PersonalityTraits {
  const code = parseMbti(mbti);
  if (!code) return traits;
  const next = { ...traits };
  for (const def of TRAIT_DEFS) {
    if (!def.mbti) continue;
    const wantHigh = code[def.mbti.index] === def.mbti.high;
    const value = next[def.key];
    if (value === 50) next[def.key] = wantHigh ? 50 + MBTI_NUDGE : 50 - MBTI_NUDGE;
    else if (value > 50 !== wantHigh) next[def.key] = 100 - value;
  }
  return next;
}

/**
 * 연계 수치로 MBTI를 다시 계산한다. 중간값(50)인 축은 기존 글자를 유지한다.
 * 직접 입력한 비표준 값이면 건드리지 않도록 null.
 */
export function mbtiFromTraits(
  traits: PersonalityTraits,
  current: string
): string | null {
  const base = current.trim() ? parseMbti(current) : "ISTP";
  if (!base) return null;
  const letters = base.split("");
  for (const def of TRAIT_DEFS) {
    if (!def.mbti) continue;
    const value = traits[def.key];
    if (value > 50) letters[def.mbti.index] = def.mbti.high;
    else if (value < 50) letters[def.mbti.index] = def.mbti.low;
  }
  return letters.join("");
}

export const SPENDING_STYLE_PRESETS = [
  "절약형",
  "계획 소비형",
  "가성비형",
  "취향 집중형",
  "충동 구매형",
  "플렉스형",
];

export const MOBILITY_PATTERN_PRESETS = [
  "집돌이/집순이",
  "동네 탐방파",
  "핫플 추적파",
  "루틴형 단골파",
  "즉흥 방황파",
];

function toMinutes(time: string): number | null {
  const [h, m] = time.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}

/** 취침·기상 시각으로 수면 시간과 생활 리듬 유형을 계산 */
export function describeSleep(bedtime: string, wakeTime: string) {
  const bed = toMinutes(bedtime);
  const wake = toMinutes(wakeTime);
  if (bed === null || wake === null) return null;
  const hours = (((wake - bed) % 1440) + 1440) % 1440 / 60;
  // 정오 이전 취침은 '자정을 넘긴' 시각으로 본다
  const bedFromNoon = bed < 720 ? bed + 1440 : bed;
  const chronotype =
    bedFromNoon <= 23 * 60 ? "아침형" : bedFromNoon <= 25 * 60 ? "보통" : "올빼미형";
  return { hours: Math.round(hours * 10) / 10, chronotype };
}
