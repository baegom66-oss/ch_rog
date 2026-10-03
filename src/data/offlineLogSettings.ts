import type { OfflineLogFrequency } from "@/types";

export interface OfflineLogOption {
  value: OfflineLogFrequency;
  label: string;
  intervalHint: string;
  storageHint: string;
  /** 캐릭터 1명 기준 대략적인 일일 로그 건수 (정지=0) */
  logsPerDay: number;
}

export const OFFLINE_LOG_OPTIONS: OfflineLogOption[] = [
  {
    value: "day8",
    label: "하루 8개 (최대 빈도)",
    intervalHint: "약 3시간마다 1개 · 주요 일과 중심",
    storageHint:
      "상세한 일상을 남기지만, 캐릭터가 늘면 DB 사용량이 빠르게 증가합니다.",
    logsPerDay: 8,
  },
  {
    value: "day5",
    label: "하루 5개 (기본값)",
    intervalHint: "약 4.8시간마다 1개 · 적절한 밸런스",
    storageHint:
      "관찰 밀도와 용량의 균형이 좋습니다. 대부분의 관찰자에게 권장됩니다.",
    logsPerDay: 5,
  },
  {
    value: "day3",
    label: "하루 3개 (라이트)",
    intervalHint: "약 8시간마다 1개 · 핵심 동선만 기록",
    storageHint:
      "아침·낮·밤 정도의 핵심만 남겨, 캐릭터가 많아도 부담이 적습니다.",
    logsPerDay: 3,
  },
  {
    value: "day1",
    label: "하루 1개 (초절약)",
    intervalHint: "24시간에 1개 · 오늘의 대표 사건만 기록",
    storageHint:
      "캐릭터가 많아도 DB 용량을 대폭 아낄 수 있습니다.",
    logsPerDay: 1,
  },
  {
    value: "paused",
    label: "오프라인 정지",
    intervalHint: "미접속 시 생성 안 함 · 접속 중에만 시간 흐름",
    storageHint:
      "미접속 구간에는 로그가 쌓이지 않아 저장 공간을 거의 쓰지 않습니다.",
    logsPerDay: 0,
  },
];

export const DEFAULT_OFFLINE_LOG_FREQUENCY: OfflineLogFrequency = "day5";

export function getOfflineLogOption(
  value: OfflineLogFrequency
): OfflineLogOption {
  return (
    OFFLINE_LOG_OPTIONS.find((o) => o.value === value) ??
    OFFLINE_LOG_OPTIONS.find((o) => o.value === DEFAULT_OFFLINE_LOG_FREQUENCY)!
  );
}

export function isOfflineLogFrequency(value: unknown): value is OfflineLogFrequency {
  return OFFLINE_LOG_OPTIONS.some((o) => o.value === value);
}
