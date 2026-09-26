import type { ActionLog, CharacterProfile } from "@/types";
import { buildCharacterSystemPrompt } from "@/lib/aiSystemPrompt";

function pickToneSnippet(toneQuotes: string): string {
  const parts = toneQuotes
    .split(/[/|·\n]/)
    .map((s) => s.replace(/^["“]|["”]$/g, "").trim())
    .filter(Boolean);
  if (parts.length === 0) return "…그래.";
  return parts[Math.floor(Math.random() * parts.length)].replace(/^"|"$/g, "");
}

function pickHangout(profile: CharacterProfile): string {
  const list = profile.locationPrefs.hangouts;
  if (list.length > 0) return list[0];
  return profile.currentLocation || "자취방";
}

/**
 * 최신 currentProfile만으로 타임라인 로그 1건을 생성한다.
 * 과거 로그 맥락은 참조하지 않는다 (Instant Profile Override 데모용).
 */
export function generateLogFromCurrentProfile(
  profile: CharacterProfile
): ActionLog {
  const location = pickHangout(profile);
  const tone = pickToneSnippet(profile.toneQuotes);
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const foodHint =
    profile.foodPreference.trim() || "평소 입맛대로 아무거나";
  const likeHint =
    profile.likesDislikes.trim() || "특별한 호불호 없음";
  const personality =
    profile.personality.trim() || "아직 성격 요약이 비어 있음";

  // 실제 API 연동 시 이 프롬프트를 system으로 전달하면 동일 규칙이 적용된다.
  void buildCharacterSystemPrompt(profile);

  const summary = `${profile.name}은(는) [${location}]에 들렀다. 지금의 성격("${personality.slice(0, 40)}${personality.length > 40 ? "…" : ""}")대로 움직이며, 식성 기준으로는 '${foodHint.slice(0, 36)}${foodHint.length > 36 ? "…" : ""}'을 떠올렸다. 말투·호불호는 방금 저장된 프로필을 그대로 따랐다.`;

  const innerThought = tone;

  const detail = `【시스템】 Instant Profile Override — 최신 currentProfile 100% 적용
과거 로그는 읽기 전용 스냅샷으로 격리됨. 이번 생성은 이전 서사와 무관하다.

【적용 프로필 스냅샷】
· 성격: ${personality}
· 말투 샘플: ${tone}
· 식성: ${foodHint}
· 호불호: ${likeHint}
· 동선 성향: ${profile.locationPrefs.mobilityPattern || "미설정"}

【${time}】 ${location}
${profile.name}: "${tone}"
(${profile.name}의 행동은 수정된 프로필을 즉시 반영한 결과입니다. 과거 성격과의 개연성을 설명하지 않습니다.)

${profile.name} (속마음): ${tone}`;

  return {
    id: `log-override-${Date.now()}`,
    characterId: profile.id,
    time,
    location,
    summary,
    innerThought,
    detail,
    isFavorite: false,
    placeTags: ["프로필즉시반영", "테스트생성"],
    contextNote: `최신 프로필 즉시 적용 · [${location}]에서 새 로그 생성`,
  };
}
