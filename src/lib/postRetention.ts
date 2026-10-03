import { SNS_FAVORITE_MAX, SNS_POST_LIMIT } from "@/data/dummy";
import { toDateKey } from "@/lib/date";
import type { SnsPost } from "@/types";

/** 최신순 정렬 키. 날짜가 없는 글은 오늘 글로 본다 */
export function postSortKey(post: SnsPost, today: string) {
  return `${post.date ?? today} ${post.time}`;
}

export function favoritePostCount(posts: SnsPost[], characterId: string) {
  return posts.filter((p) => p.characterId === characterId && p.isFavorite).length;
}

/** 즐겨찾기가 가득 찬 캐릭터 id. 이 캐릭터들은 새 게시물을 올리지 않는다 */
export function postBlockedIds(posts: SnsPost[]): Set<string> {
  const counts = new Map<string, number>();
  for (const p of posts) {
    if (p.isFavorite) counts.set(p.characterId, (counts.get(p.characterId) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, n]) => n >= SNS_FAVORITE_MAX).map(([id]) => id));
}

/**
 * 캐릭터마다 즐겨찾기 글은 항상 남기고, 나머지는 (한도 - 즐겨찾기 수)개까지 최신순으로 남긴다.
 * 원래 배열 순서는 유지한다.
 */
export function trimPosts(posts: SnsPost[]): SnsPost[] {
  const today = toDateKey(new Date());
  const byCharacter = new Map<string, SnsPost[]>();
  for (const p of posts) {
    const list = byCharacter.get(p.characterId) ?? [];
    list.push(p);
    byCharacter.set(p.characterId, list);
  }
  const keep = new Set<string>();
  for (const list of byCharacter.values()) {
    const favorites = list.filter((p) => p.isFavorite);
    favorites.forEach((p) => keep.add(p.id));
    list
      .filter((p) => !p.isFavorite)
      .sort((a, b) => postSortKey(b, today).localeCompare(postSortKey(a, today)))
      .slice(0, Math.max(0, SNS_POST_LIMIT - favorites.length))
      .forEach((p) => keep.add(p.id));
  }
  return keep.size === posts.length ? posts : posts.filter((p) => keep.has(p.id));
}
