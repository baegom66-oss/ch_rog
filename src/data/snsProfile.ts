import type { CharacterProfile, SnsProfile } from "@/types";

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** 저장된 SNS 프로필이 없는(예전 저장분) 캐릭터도 항상 같은 값이 나오도록 id 기반 기본값 사용 */
export function getSnsProfile(character: CharacterProfile): SnsProfile {
  if (character.sns) return character.sns;
  const h = hashId(character.id);
  return { followers: 50 + (h % 950), following: 10 + (h % 190), bio: "" };
}

export function createRandomSnsProfile(): SnsProfile {
  return {
    followers: 20 + Math.floor(Math.random() * 280),
    following: 10 + Math.floor(Math.random() * 140),
    bio: "",
  };
}

/** 팔로워 수의 3~15% 수준에서 임의 좋아요 수 */
export function randomLikesFor(followers: number): number {
  return Math.max(1, Math.round(followers * (0.03 + Math.random() * 0.12)));
}

export function formatCount(n: number): string {
  if (n >= 10000) {
    return `${(n / 10000).toFixed(1).replace(/\.0$/, "")}만`;
  }
  return n.toLocaleString("ko-KR");
}

/** 0 이상 정수만 허용, 그 외는 null */
export function parseCount(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n >= 0 ? n : null;
}
