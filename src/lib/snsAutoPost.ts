import { activeEventFor } from "@/data/events";
import { getSnsProfile, randomLikesFor } from "@/data/snsProfile";
import { toDateKey, toTimeKey } from "@/lib/date";
import { buildEventPost } from "@/lib/eventStory";
import { pick, randInt } from "@/lib/random";
import {
  loadStoredJson,
  saveStoredJson,
  STORAGE_KEYS,
} from "@/lib/persistence";
import { postBlockedIds } from "@/lib/postRetention";
import { pickShareTarget, shareCaption } from "@/lib/snsEngagement";
import { toHashtags, toneSnippet } from "@/lib/text";
import type { CharacterProfile, SnsPost, StoryEvent } from "@/types";

/** 캐릭터당 하루 자동 게시물 수 범위 */
export const SNS_AUTO_POSTS_PER_DAY = { min: 1, max: 2 } as const;

interface CharacterSlots {
  /** 오늘 게시 예정 시각 (HH:MM, 오름차순) */
  times: string[];
  /** 이미 생성한 개수 */
  done: number;
}

interface SnsAutoPlan {
  date: string;
  slots: Record<string, CharacterSlots>;
}

/** 1~2개 슬롯. 2개면 오전~오후 / 저녁으로 나눠 너무 붙지 않게 */
function randomSlotTimes(): string[] {
  const count = randInt(SNS_AUTO_POSTS_PER_DAY.min, SNS_AUTO_POSTS_PER_DAY.max);
  const ranges: [number, number][] =
    count === 1 ? [[9, 22]] : [[9, 15], [17, 22]];
  return ranges.map(([from, to]) =>
    toTimeKey(new Date(2000, 0, 1, randInt(from, to), randInt(0, 59)))
  );
}

function buildOriginalPost(character: CharacterProfile) {
  const place =
    pick(character.locationPrefs.hangouts) || character.currentLocation || "동네";
  const hobby = pick(character.subHobbies);
  const food = character.foodPreference.split(/[.·,]/)[0]?.trim();
  const tone = toneSnippet(character.toneQuotes);

  const templates: { content: string; tags: string[] }[] = [
    {
      content: `오늘은 ${place}. ${hobby ? `${hobby} 하다 보니 시간 순삭.` : "그냥 멍하니 있었다."}`,
      tags: [place, ...(hobby ? [hobby] : [])],
    },
    {
      content: `${place} 다녀옴. ${food ? `${food}… 역시 이 맛이지.` : "별일 없이 좋은 하루."}`,
      tags: [place, "일상"],
    },
    {
      content: hobby
        ? `${hobby} 기록 남겨둠. 오늘도 조금씩.`
        : `${place}에서 보낸 오후. 기록용.`,
      tags: [...(hobby ? [hobby] : [place]), "기록"],
    },
  ];
  const t = pick(templates)!;
  return {
    content: tone ? `${t.content} ${tone}` : t.content,
    hashtags: toHashtags(t.tags),
  };
}

/**
 * 이벤트 중이면 이벤트 글만 쓴다.
 * 공유는 같은 세계 캐릭터의 글 중 관계·친밀도·사회성에 따라 정해진다 (다른 세계는 존재 자체를 모른다).
 * AI 생성 시에는 이 결과를 실패 대비용으로 두고 content·hashtags만 바꿔 쓴다.
 */
export function buildAutoPost(
  character: CharacterProfile,
  characters: CharacterProfile[],
  event: StoryEvent | undefined,
  allPosts: SnsPost[],
  id: string,
  date: string,
  time: string,
  allowShare = true
): SnsPost {
  const base = {
    id,
    characterId: character.id,
    authorName: character.name,
    authorColor: character.avatarColor,
    likes: randomLikesFor(getSnsProfile(character).followers),
    reactions: [],
    comments: [],
    date,
    time,
  };

  if (event) return { ...base, ...buildEventPost(character, event, characters, date) };

  const target = allowShare ? pickShareTarget(character, characters, allPosts) : undefined;
  if (target) {
    return {
      ...base,
      content: shareCaption(character, characters.find((c) => c.id === target.characterId)),
      hashtags: [],
      sharedPostId: target.id,
    };
  }

  return { ...base, ...buildOriginalPost(character) };
}

/**
 * 오늘의 게시 계획에서 시각이 지난 슬롯만큼 게시물을 생성해 반환한다.
 * 계획(날짜·슬롯·진행도)은 LocalStorage에 저장돼 새로고침해도 중복 생성되지 않는다.
 * 일시정지된 세계의 캐릭터와 즐겨찾기가 가득 찬 캐릭터는 건너뛰고, 이벤트에 참여 중인 캐릭터는 이벤트 글을 쓴다.
 */
export function runSnsAutoPost(
  characters: CharacterProfile[],
  posts: SnsPost[],
  events: StoryEvent[],
  now: Date,
  pausedWorlds: Set<string>
): SnsPost[] {
  const today = toDateKey(now);
  const nowTime = toTimeKey(now);
  const stored = loadStoredJson<SnsAutoPlan>(STORAGE_KEYS.snsAutoPostPlan);
  const plan: SnsAutoPlan =
    stored && stored.date === today ? stored : { date: today, slots: {} };

  const existingIds = new Set(posts.map((p) => p.id));
  const blocked = postBlockedIds(posts);
  const generated: SnsPost[] = [];

  for (const character of characters) {
    if (pausedWorlds.has(character.worldId)) continue;
    const event = activeEventFor(character, events, today);
    const slots = (plan.slots[character.id] ??= {
      times: randomSlotTimes(),
      done: 0,
    });
    while (slots.done < slots.times.length && slots.times[slots.done] <= nowTime) {
      const id = `sns-auto-${today}-${character.id}-${slots.done}`;
      // 즐겨찾기가 가득 찬 캐릭터는 이 슬롯을 건너뛴다 (나중에 풀어도 몰아서 올리지 않게)
      if (!existingIds.has(id) && !blocked.has(character.id)) {
        generated.push(
          buildAutoPost(
            character,
            characters,
            event,
            [...generated, ...posts],
            id,
            today,
            slots.times[slots.done]
          )
        );
      }
      slots.done += 1;
    }
  }

  saveStoredJson(STORAGE_KEYS.snsAutoPostPlan, plan);
  return generated;
}
