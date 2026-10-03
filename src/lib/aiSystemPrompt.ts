/**
 * OC 관찰 시뮬레이터 — AI 행동/대사/로그 생성용 시스템 규칙
 * Gemini 요청의 system instruction으로 쓰고, 출력 형식 규칙은 aiGenerate에서 덧붙인다.
 */

import { eventDayLabel, eventPlace } from "@/data/events";
import { TRAIT_DEFS } from "@/data/profileOptions";
import { findRelationship, getRelationshipType } from "@/data/relationships";
import { worldLore } from "@/data/worlds";
import type { CharacterProfile, Facility, StoryEvent, World } from "@/types";

const INSTANT_PROFILE_OVERRIDE_RULES = `
# 최신 프로필 최우선 규칙 (Instant Profile Override)

## 절대 우선순위
1. **현재 설정된 최신 캐릭터 프로필** (성격 요약, 말투 예시·대표 대사, 식성, 호불호, 관계 태그·친밀도, 동선 성향)을 1순위 절대 지침으로 삼는다.
2. 과거 생성된 타임라인 로그, 이전 SNS 글, 과거 대화 맥락보다 **최신 프로필이 항상 우선**한다.
3. 프로필이 방금 변경되었다면, 과거 성격과의 서사적 기승전결·개연성을 설명하거나 완곡하게 이어 붙이지 **않는다**.

## 즉시 변경 적용
- 프로필 설정이 바뀐 경우, **다음 생성부터** 변경된 성격·말투·취향을 **즉각 100% 적용**하여 대사와 행동을 출력한다.
- "예전엔 ~했는데 이제는…" 같은 **전환 변명·복선 설명**을 쓰지 않는다. 새 설정이 곧 그 캐릭터의 현재다.
- 말투 예시/대표 대사 필드에 적힌 어조·어미·금지어를 대사와 혼잣말에 직접 반영한다.

## 과거 로그 격리 (Read-only History)
- 과거 로그는 **읽기 전용 스냅샷**이다. 관찰·보관·인용만 가능하며, 새 행동 생성의 제약 조건이 되지 않는다.
- 과거 로그의 성격·식성·관계와 최신 프로필이 충돌해도, **최신 프로필을 따른다**.
- 과거 로그를 수정하지 않는 한, 히스토리 자체는 그대로 두고 **앞으로의 생성물만** 새 규칙을 따른다.
`.trim();

const or = (value: string) => value.trim() || "(미입력)";

/** 같은 세계 캐릭터에 대한 이 캐릭터의 관계 (다른 세계 캐릭터는 넘기지 않는다) */
function relationshipLines(profile: CharacterProfile, worldmates: CharacterProfile[]) {
  const lines = worldmates
    .filter((c) => c.id !== profile.id)
    .map((c) => {
      const rel = findRelationship(profile, c.id);
      const type = getRelationshipType(rel.type).label;
      return [
        `- ${c.name}: ${type}${rel.tag && rel.tag !== type ? `(${rel.tag})` : ""}, 친밀도 ${rel.affinity}/100`,
        rel.impression && `속마음 "${rel.impression}"`,
        rel.description && `관계 설명: ${rel.description}`,
        c.personality && `${c.name}의 성격: ${c.personality}`,
      ]
        .filter(Boolean)
        .join(" · ");
    });
  return lines.length > 0 ? lines.join("\n") : "- (같은 세계에 다른 캐릭터가 없음)";
}

function eventSection(event: StoryEvent, today: string, worldmates: CharacterProfile[]) {
  const together = worldmates
    .filter((c) => event.participantIds.includes(c.id))
    .map((c) => c.name);
  return `
---
# 참여 중인 이벤트 (최우선 상황)

- 이벤트: ${event.emoji} ${event.title} (${event.startDate} ~ ${event.endDate}, 오늘은 ${eventDayLabel(event, today)})
- 무대(이벤트가 펼쳐지는 넓은 배경): ${eventPlace(event)}
- 무대 안의 전용 시설(세부 장소): ${or(event.facilities.map((f) => `${f.name}(${f.type})${f.description ? ` - ${f.description}` : ""}`).join(" / "))}
- 내용: ${or(event.description)}
- 함께 참여하는 캐릭터: ${or(together.join(", "))}

이벤트 기간에는 평소 일과 대신 이 이벤트 속에서 보내는 하루로 타임라인과 SNS를 작성한다. 캐릭터의 성격과 말투는 그대로 유지하되, 장소·행동·사건은 이벤트 설정을 따른다. 무대는 넓은 배경이고 전용 시설은 그 안의 세부 장소다. 전용 시설이 있으면 세계의 평소 시설 대신, 무대 안의 그 시설들을 오가며 하루를 보낸다.
`;
}

/**
 * LLM system prompt 조립용 헬퍼.
 * worldmates·places는 이 캐릭터가 사는 세계의 캐릭터·장소만 넘긴다.
 * activeEvent는 오늘 이 캐릭터가 참여 중인 이벤트.
 */
export function buildCharacterSystemPrompt(
  profile: CharacterProfile,
  world: World,
  worldmates: CharacterProfile[],
  places: Facility[],
  activeEvent?: StoryEvent,
  today?: string
): string {
  const traits = TRAIT_DEFS.map(
    (t) => `${t.label} ${profile.traits[t.key]}/100 (${t.low} ↔ ${t.high})`
  ).join(", ");
  const { backstory, sleep, spending, locationPrefs } = profile;
  const others = worldmates.filter((c) => c.id !== profile.id).map((c) => c.name);
  const placeList = places
    .filter((p) => p.unlocked)
    .map((p) => `${p.name}(${p.type})`)
    .join(", ");

  return `${INSTANT_PROFILE_OVERRIDE_RULES}

---
# 세계 (world)

- 세계 이름: ${world.name}
- 세계관: ${worldLore(world)}
- 이 세계의 장소: ${or(placeList)}
- 같은 세계의 캐릭터: ${or(others.join(", "))}

세계관에 맞는 사건·장소·말투로만 타임라인과 SNS를 만든다. 이 세계에 없는 장소나, 다른 세계의 캐릭터는 존재 자체를 모르므로 절대 등장시키지 않는다.
${activeEvent && today ? eventSection(activeEvent, today, worldmates) : ""}
---
# 현재 적용 중 프로필 (currentProfile · 최신)

- 이름: ${profile.name}
- 나이 / 성별: ${profile.age ?? "미상"} / ${or(profile.gender)}
- MBTI / 성향: ${profile.mbti} / ${profile.alignment}
- 성격 요약: ${or(profile.personality)}
- 성향 수치: ${traits}
- 말투·대표 대사: ${or(profile.toneQuotes)}
- 습관·버릇: ${or(profile.habits)}
- 수면: ${sleep.bedtime} 취침 · ${sleep.wakeTime} 기상${sleep.note ? ` · ${sleep.note}` : ""}
- 소비: ${or(spending.style)}${spending.note ? ` · ${spending.note}` : ""}
- 성장 환경: ${or(backstory.upbringing)}
- 결정적 사건: ${or(backstory.turningPoints)}
- 상처·트라우마: ${or(backstory.wounds)}
- 목표·원동력: ${or(backstory.motivation)}
- 식성: ${or(profile.foodPreference)}
- 좋아하는 것: ${or(profile.likes)}
- 싫어하는 것: ${or(profile.dislikes)}
- 반려동물: ${or(profile.pets)}
- 취미: ${or(profile.subHobbies.join(", "))}
- 단골 장소: ${or(locationPrefs.hangouts.join(", "))}
- 가 보고 싶은 곳: ${or(locationPrefs.interested.join(", "))}
- 동선 성향: ${or(locationPrefs.mobilityPattern)}
- 요즘 상태: ${or(profile.currentLocation)} · ${or(profile.currentAction)}
- 품고 있는 소원: ${or(profile.wishes.map((w) => w.text).join(" / "))}

## 같은 세계 캐릭터와의 관계 (이 캐릭터의 시점)
${relationshipLines(profile, worldmates)}

관계 분류·친밀도에 맞는 거리감으로 대한다. 모르는 사이면 아는 척하지 않는다.

위 currentProfile이 과거 로그보다 우선한다. 지금부터 생성하는 모든 타임라인·SNS·대사는 이 설정을 100% 따른다.
`;
}

export const PROFILE_OVERRIDE_UI_HINT =
  "프로필(성격, 말투 등)을 수정하면 과거 로그와 상관없이 다음 생성되는 타임라인과 SNS글부터 바뀐 설정이 즉시 적용됩니다.";
