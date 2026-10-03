import { pick } from "@/lib/random";

/** 말투 예시에서 대사 한 줄을 뽑는다 (괄호 설명·따옴표 제거) */
export function toneSnippet(toneQuotes: string): string {
  const parts = toneQuotes
    .split(/[/|\n]/)
    .map((s) => s.replace(/\([^)]*\)/g, "").replace(/["“”]/g, "").trim())
    .filter(Boolean);
  return pick(parts) ?? "";
}

/** SNS 게시물 1개당 해시태그 최대 수 */
export const SNS_HASHTAG_MAX = 5;
/** 타임라인 카드 1개당 키워드 최대 수 */
export const LOG_KEYWORD_MAX = 3;

export function toHashtags(words: string[]): string[] {
  const tags = words.map((w) => `#${w.replace(/[\s'"·()[\]]/g, "")}`);
  return [...new Set(tags)].filter((t) => t.length > 1).slice(0, SNS_HASHTAG_MAX);
}

/** 타임라인 로그의 키워드 (예전 데이터의 # 표기는 떼고 최대 LOG_KEYWORD_MAX개) */
export function toKeywords(words: string[] | undefined): string[] {
  const keywords = (words ?? []).map((w) => w.replace(/^#+/, "").trim()).filter(Boolean);
  return [...new Set(keywords)].slice(0, LOG_KEYWORD_MAX);
}

/** 마지막 글자에 받침이 있으면 withBatchim, 없으면 without (예: 은/는, 와/과) */
export function josa(word: string, withBatchim: string, without: string) {
  const code = word.trim().charCodeAt(word.trim().length - 1) - 0xac00;
  const hasBatchim = code >= 0 && code <= 11171 && code % 28 !== 0;
  return `${word}${hasBatchim ? withBatchim : without}`;
}
