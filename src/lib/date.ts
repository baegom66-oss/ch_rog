function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** 로컬 시간 기준 YYYY-MM-DD */
export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 로컬 시간 기준 HH:MM */
export function toTimeKey(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** YYYY-MM-DD → "10월 3일" */
export function formatMonthDay(dateKey: string) {
  const [, month, day] = dateKey.split("-").map(Number);
  return `${month}월 ${day}일`;
}

const DAY_MS = 86_400_000;

function dateKeyToUtc(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** YYYY-MM-DD에 n일을 더한 날짜 */
export function addDays(dateKey: string, n: number) {
  const d = new Date(dateKeyToUtc(dateKey) + n * DAY_MS);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** to - from (일 단위). 같은 날이면 0 */
export function daysBetween(from: string, to: string) {
  return Math.round((dateKeyToUtc(to) - dateKeyToUtc(from)) / DAY_MS);
}
