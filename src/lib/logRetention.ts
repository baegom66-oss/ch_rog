import { FEED_LOG_LIMIT } from "@/data/dummy";
import { toDateKey } from "@/lib/date";
import type { ActionLog } from "@/types";

/** 최신순 정렬 키. 날짜가 없는 예전 기본 로그는 오늘 기록으로 본다 */
export function logSortKey(log: ActionLog, today: string) {
  return `${log.date ?? today} ${log.time}`;
}

/**
 * 보관함(즐겨찾기) 로그는 항상 남기고, 나머지는 (한도 - 보관함 수)개까지 최신순으로 남긴다.
 * 원래 배열 순서는 유지한다.
 */
export function trimLogs(logs: ActionLog[]): ActionLog[] {
  if (logs.length <= FEED_LOG_LIMIT) return logs;
  const today = toDateKey(new Date());
  const favorites = logs.filter((l) => l.isFavorite).length;
  const keep = new Set(
    logs
      .filter((l) => !l.isFavorite)
      .sort((a, b) => logSortKey(b, today).localeCompare(logSortKey(a, today)))
      .slice(0, Math.max(0, FEED_LOG_LIMIT - favorites))
      .map((l) => l.id)
  );
  return logs.filter((l) => l.isFavorite || keep.has(l.id));
}
