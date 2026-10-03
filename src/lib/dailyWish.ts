import { createWishId } from "@/data/createCharacter";
import { toDateKey } from "@/lib/date";
import { loadWishRollDate, saveWishRollDate } from "@/lib/persistence";
import { pick } from "@/lib/random";
import type { CharacterProfile, CharacterWish } from "@/types";

/** 하루에 캐릭터마다 오늘의 소원이 생길 확률 */
export const WISH_DAILY_PROBABILITY = 0.3;

function splitList(text: string): string[] {
  return text
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function firstSentence(text: string): string {
  return text.split(/(?<=[.!?])\s/)[0]?.trim() ?? "";
}

/** 프로필(관심 장소·취향·관계·목표·성향 수치)에서 소원 후보를 만든다 */
function wishCandidates(
  character: CharacterProfile,
  all: CharacterProfile[]
): string[] {
  const { traits } = character;
  const candidates: string[] = [];

  const place = pick(character.locationPrefs.interested)
    ?.replace(/\s*\(미해금\)\s*/g, "")
    .trim();
  if (place) candidates.push(`${place}에 가 보고 싶다. 오늘은 그 생각이 계속 났다.`);

  const like = pick(splitList(character.likes));
  if (like) candidates.push(`${like}… 조만간 마음껏 누리고 싶다.`);

  const hobby = pick(character.subHobbies);
  if (hobby) {
    candidates.push(`${hobby}, 이번엔 시간 신경 안 쓰고 제대로 해 보고 싶다.`);
  }

  const worldmates = all.filter(
    (c) => c.worldId === character.worldId && c.id !== character.id
  );
  const closest = character.relationships
    .filter((r) => r.type !== "stranger" && worldmates.some((c) => c.id === r.targetId))
    .sort((a, b) => b.affinity - a.affinity)[0];
  const friend = closest && worldmates.find((c) => c.id === closest.targetId);
  if (friend) {
    candidates.push(`${friend.name}에게 먼저 연락해 볼까. 오늘은 용기가 날 것 같기도.`);
  }

  const motivation = firstSentence(character.backstory.motivation);
  if (motivation) candidates.push(`${motivation} 그 꿈에 한 걸음만 더 가까워졌으면.`);

  if (traits.energy < 40) {
    candidates.push("하루 종일 아무것도 안 하고 이불 속에만 있고 싶다.");
  } else if (traits.energy > 60) {
    candidates.push("하루에 새로운 곳을 세 군데는 돌아보고 싶다. 체력은 남아도니까.");
  }

  candidates.push(
    traits.sociability >= 50
      ? "좋아하는 사람들 잔뜩 불러서 왁자지껄하게 놀고 싶다."
      : "아무도 말 걸지 않는 조용한 곳에서 하루를 통째로 보내고 싶다."
  );
  return candidates;
}

/** 간직하지 않은 소원은 생긴 날이 지나면 사라진다 */
export function isWishAlive(wish: CharacterWish, today: string) {
  return wish.kept || wish.date === today;
}

/**
 * 날짜가 바뀌었으면 간직하지 않은 지난 소원을 지우고,
 * 하루 한 번 확률로 오늘의 소원을 만든다. 소원 목록이 바뀐 캐릭터만 id별로 반환한다.
 * 일시정지된 세계는 시간이 멈춰 있으므로 건너뛴다.
 */
export function runDailyWish(
  characters: CharacterProfile[],
  now: Date,
  pausedWorlds: Set<string>
): Record<string, CharacterWish[]> {
  const today = toDateKey(now);
  const shouldRoll = loadWishRollDate() !== today;
  const changes: Record<string, CharacterWish[]> = {};

  for (const character of characters) {
    if (pausedWorlds.has(character.worldId)) continue;
    let next = character.wishes.filter((w) => isWishAlive(w, today));
    const hasTodayWish = next.some((w) => w.date === today);
    if (shouldRoll && !hasTodayWish && Math.random() < WISH_DAILY_PROBABILITY) {
      const text = pick(wishCandidates(character, characters));
      if (text) {
        next = [
          ...next,
          { id: createWishId(character.id), text, date: today, kept: false },
        ];
      }
    }
    const changed =
      next.length !== character.wishes.length ||
      next.some((w, i) => w !== character.wishes[i]);
    if (changed) changes[character.id] = next;
  }

  if (shouldRoll) saveWishRollDate(today);
  return changes;
}
