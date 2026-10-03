import type { KeyboardEvent } from "react";

/** 한글 IME 조합 중의 Enter는 글자 확정용이므로 제출로 보지 않는다 (마지막 글자 중복 입력 방지) */
export function isSubmitEnter(e: KeyboardEvent): boolean {
  return e.key === "Enter" && !e.nativeEvent.isComposing;
}
