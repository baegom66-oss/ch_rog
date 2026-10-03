"use client";

import { Pencil, Plus, Save, Sparkles, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import CharacterAvatar from "@/components/CharacterAvatar";
import LocationPrefsPanel from "@/components/LocationPrefsPanel";
import {
  ChipInput,
  inputClass,
  LabelRow,
  ReadBox,
  SectionTitle,
  SleepField,
  TextField,
  TraitSliders,
} from "@/components/ProfileFields";
import RelationshipGraph from "@/components/RelationshipGraph";
import SecretDiaryCard from "@/components/SecretDiaryCard";
import WorldMembershipCard from "@/components/WorldMembershipCard";
import {
  ALIGNMENT_OPTIONS,
  alignTraitsToMbti,
  GENDER_PRESETS,
  MBTI_OPTIONS,
  mbtiFromTraits,
  SPENDING_STYLE_PRESETS,
} from "@/data/profileOptions";
import type { WorldPopulation } from "@/data/worlds";
import { PROFILE_OVERRIDE_UI_HINT } from "@/lib/aiSystemPrompt";
import { CHARACTER_COLORS, characterProfileTheme } from "@/lib/color";
import { readImageAsDataUrl } from "@/lib/image";
import { isSubmitEnter } from "@/lib/keyboard";
import type {
  Backstory,
  CharacterProfile,
  CharacterRelationship,
  LocationPreferences,
  PersonalityTraits,
  World,
} from "@/types";

interface CharacterTabProps {
  character: CharacterProfile;
  /** 같은 세계의 캐릭터만 (자기 자신 포함) */
  allCharacters: CharacterProfile[];
  worlds: World[];
  worldPopulation: WorldPopulation;
  /** 프로필 설정 변경. 프로필 저장 시각이 함께 갱신된다 */
  onUpdate: (patch: Partial<CharacterProfile>) => void;
  /** 일기·소원처럼 프로필 설정이 아닌 값 변경 */
  onPatch: (patch: Partial<CharacterProfile>) => void;
  onUpdateRelationship: (rel: CharacterRelationship) => void;
  onMoveWorld: (worldId: string) => void;
}

const AVATAR_MAX_SIZE = 320;

/** 상세 프로필 편집 폼이 수정하는 필드 */
const PROFILE_FORM_FIELDS = [
  "avatarUrl",
  "avatarColor",
  "name",
  "age",
  "gender",
  "personality",
  "toneQuotes",
  "mbti",
  "alignment",
  "traits",
  "habits",
  "sleep",
  "spending",
  "backstory",
  "foodPreference",
  "likes",
  "dislikes",
  "pets",
  "subHobbies",
] as const satisfies readonly (keyof CharacterProfile)[];

const BACKSTORY_FIELDS: {
  key: keyof Backstory;
  label: string;
  hint: string;
  placeholder: string;
}[] = [
  {
    key: "upbringing",
    label: "성장 환경",
    hint: "가족 구성, 자란 동네, 어린 시절 분위기. 기본적인 생활 감각과 말버릇의 뿌리가 됩니다.",
    placeholder: "예: 형제 많은 집의 막내로, 늘 북적이는 집에서 자랐다",
  },
  {
    key: "turningPoints",
    label: "결정적 사건",
    hint: "지금의 성격·취미를 만든 계기. 비슷한 상황에서 떠올리는 기억으로 쓰입니다.",
    placeholder: "예: 고등학교 축제에서 처음 무대에 서 본 날",
  },
  {
    key: "wounds",
    label: "상처 · 트라우마",
    hint: "건드리면 예민해지는 지점. 관계에서 물러서거나 화를 내는 이유가 됩니다.",
    placeholder: "예: 믿었던 친구에게 비밀이 퍼진 뒤로 속마음을 잘 말하지 않는다",
  },
  {
    key: "motivation",
    label: "목표 · 원동력",
    hint: "지금 무엇을 바라고 사는지. 장기적인 행동 방향과 소원에 반영됩니다.",
    placeholder: "예: 언젠가 작은 공방을 열고 싶다",
  },
];

function AvatarColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const isCustom = !CHARACTER_COLORS.some((c) => c.toLowerCase() === value.toLowerCase());
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {CHARACTER_COLORS.map((color) => {
        const active = color.toLowerCase() === value.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`h-7 w-7 rounded-full transition ${
              active ? "ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--paper)]" : "hover:scale-110"
            }`}
            style={{ backgroundColor: color }}
            aria-label={`대표 색상 ${color}`}
            aria-pressed={active}
          />
        );
      })}
      <label
        className={`relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-[var(--line)] text-[var(--muted)] ${
          isCustom ? "ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--paper)]" : ""
        }`}
        style={isCustom ? { backgroundColor: value } : undefined}
        title="직접 고르기"
      >
        {!isCustom && <Plus className="h-3.5 w-3.5" />}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="대표 색상 직접 고르기"
        />
      </label>
    </div>
  );
}

function formatAge(age: number | null) {
  return age === null || Number.isNaN(age) ? "미상" : `${age}세`;
}

export default function CharacterTab({
  character,
  allCharacters,
  worlds,
  worldPopulation,
  onUpdate,
  onPatch,
  onUpdateRelationship,
  onMoveWorld,
}: CharacterTabProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CharacterProfile>(character);
  const [hobbyInput, setHobbyInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const display = editing ? draft : character;
  const patchDraft = (patch: Partial<CharacterProfile>) => {
    setDraft((d) => ({ ...d, ...patch }));
  };

  const patchBackstory = (patch: Partial<Backstory>) => {
    setDraft((d) => ({ ...d, backstory: { ...d.backstory, ...patch } }));
  };

  const changeMbti = (mbti: string) => {
    patchDraft({ mbti, traits: alignTraitsToMbti(draft.traits, mbti) });
  };

  const changeTraits = (traits: PersonalityTraits) => {
    patchDraft({ traits, mbti: mbtiFromTraits(traits, draft.mbti) ?? draft.mbti });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      patchDraft({ avatarUrl: await readImageAsDataUrl(file, AVATAR_MAX_SIZE) });
    } catch {
      /* 이미지가 아니거나 읽기 실패 */
    }
  };

  const addHobby = () => {
    const value = hobbyInput.trim();
    if (value && !draft.subHobbies.includes(value)) {
      patchDraft({ subHobbies: [...draft.subHobbies, value] });
    }
    setHobbyInput("");
  };

  const startEdit = () => {
    setDraft(character);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setNameError("");
    setHobbyInput("");
  };

  const saveEdit = () => {
    if (!draft.name.trim()) {
      setNameError("이름은 필수입니다.");
      return;
    }
    // 관계·동선·일기는 각자 패널에서 따로 저장되므로, 편집 폼이 다루는 필드만 반영
    const patch: Partial<CharacterProfile> = Object.fromEntries(
      PROFILE_FORM_FIELDS.map((key) => [key, draft[key]])
    );
    onUpdate({
      ...patch,
      name: draft.name.trim(),
      age: draft.age === null || Number.isNaN(draft.age) ? null : draft.age,
    });
    setEditing(false);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1800);
  };

  return (
    <div
      className="min-h-full space-y-5 bg-[var(--wash)] px-4 py-4 pb-6"
      style={characterProfileTheme(display.avatarColor)}
    >
      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-sm text-[var(--ink)]">
            상세 프로필
          </h2>
          <div className="flex items-center gap-2">
            {savedFlash && (
              <span className="text-[10px] text-[var(--accent)]">프로필 저장됨</span>
            )}
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--muted)] hover:bg-[var(--wash)]"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent)] px-2.5 py-1.5 text-[11px] font-medium text-white"
                >
                  <Save className="h-3 w-3" />
                  저장
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)]"
              >
                <Pencil className="h-3 w-3" />
                프로필 편집
              </button>
            )}
          </div>
        </div>

        <div className="mb-3 flex gap-2 rounded-xl border border-dashed border-[var(--accent)]/35 bg-[var(--accent-soft)]/50 px-3 py-2.5">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
          <p className="text-[11px] leading-5 text-[var(--ink)]/85">
            {PROFILE_OVERRIDE_UI_HINT}
          </p>
        </div>

        {character.profileUpdatedAt && (
          <p className="mb-3 text-[10px] text-[var(--muted)]">
            마지막 프로필 저장:{" "}
            {new Date(character.profileUpdatedAt).toLocaleString("ko-KR")} · 이후
            생성분부터 최신 설정 적용
          </p>
        )}

        <div className="space-y-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <div
            aria-hidden
            className="-mx-4 -mt-4 h-2 bg-[linear-gradient(90deg,var(--character),var(--accent-soft))]"
          />
          {/* 초상화 */}
          <div>
            <LabelRow
              label="캐릭터 초상화"
              hint="업로드하거나 URL을 넣으면 헤더와 프로필에 반영됩니다. 없으면 대표 색상이 표시됩니다."
            />
            <div className="flex items-center gap-4">
              <CharacterAvatar
                url={display.avatarUrl}
                color={display.avatarColor}
                name={display.name}
                size="lg"
              />
              {editing ? (
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      handleFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-xs text-[var(--ink)] hover:bg-[var(--line)]"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    이미지 업로드
                  </button>
                  <input
                    type="url"
                    placeholder="이미지 URL 붙여넣기"
                    value={draft.avatarUrl.startsWith("data:") ? "" : draft.avatarUrl}
                    onChange={(e) => patchDraft({ avatarUrl: e.target.value })}
                    className={inputClass}
                  />
                  {draft.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => patchDraft({ avatarUrl: "" })}
                      className="text-[11px] text-red-600/80 hover:underline"
                    >
                      사진 제거
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[11px] leading-5 text-[var(--muted)]">
                  {display.avatarUrl
                    ? "커스텀 초상화가 등록되어 있습니다."
                    : "사진이 없어 대표 색상으로 표시돼요."}
                </p>
              )}
            </div>
          </div>

          {/* 대표 색상 */}
          <div>
            <LabelRow
              label="대표 색상"
              hint="캐릭터 프로필 화면과 타임라인 카드의 색으로 쓰여요. 사진을 넣어도 이 색을 따라요."
            />
            {editing ? (
              <AvatarColorPicker
                value={draft.avatarColor}
                onChange={(avatarColor) => patchDraft({ avatarColor })}
              />
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className="h-6 w-6 rounded-full ring-2 ring-[var(--paper)] shadow-sm"
                  style={{ backgroundColor: display.avatarColor }}
                />
                <span className="font-mono text-[11px] uppercase text-[var(--muted)]">
                  {display.avatarColor}
                </span>
              </div>
            )}
          </div>

          {/* 기본 정보 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <LabelRow
                label="이름"
                required
                hint="관찰 화면과 로그에 표시되는 캐릭터 이름입니다."
              />
              {editing ? (
                <>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => {
                      patchDraft({ name: e.target.value });
                      if (e.target.value.trim()) setNameError("");
                    }}
                    className={inputClass}
                  />
                  {nameError && (
                    <p className="mt-1 text-[11px] text-red-600">{nameError}</p>
                  )}
                </>
              ) : (
                <ReadBox>
                  <span className="font-medium">{display.name}</span>
                </ReadBox>
              )}
            </div>

            <div>
              <LabelRow label="나이" hint="비워 두면 '미상'으로 표시됩니다." />
              {editing ? (
                <input
                  type="number"
                  min={0}
                  max={200}
                  placeholder="미상"
                  value={draft.age ?? ""}
                  onChange={(e) =>
                    patchDraft({
                      age: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className={inputClass}
                />
              ) : (
                <ReadBox>{formatAge(display.age)}</ReadBox>
              )}
            </div>

            <div>
              <LabelRow label="성별" hint="선택하거나 자유롭게 입력할 수 있습니다." />
              {editing ? (
                <ChipInput
                  options={GENDER_PRESETS}
                  value={draft.gender}
                  onChange={(gender) => patchDraft({ gender })}
                />
              ) : (
                <ReadBox>{display.gender || "미상"}</ReadBox>
              )}
            </div>
          </div>

          {/* 성격 */}
          <div className="border-t border-[var(--line)] pt-4">
            <SectionTitle>성격 및 표현 성향 · AI 행동 생성용</SectionTitle>
            <div className="space-y-3">
              <TextField
                label="성격 요약"
                hint="AI가 하루 일과와 선택을 판단할 때 기준으로 삼습니다."
                editing={editing}
                value={display.personality}
                onChange={(personality) => patchDraft({ personality })}
                rows={3}
                placeholder="예: 냉철하고 원칙을 중시하지만 은근히 챙겨주는 스타일"
              />
              <div>
                <LabelRow
                  label="성향 수치"
                  hint="같은 상황에서도 수치에 따라 반응이 달라집니다. MBTI 연계 축은 MBTI와 서로 맞춰져서, MBTI를 고르면 수치가 그쪽으로 옮겨지고 수치가 중간(50)을 넘어가면 MBTI 글자가 바뀝니다."
                />
                <TraitSliders
                  traits={display.traits}
                  editing={editing}
                  onChange={changeTraits}
                />
              </div>
              {editing ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <LabelRow
                      label="MBTI"
                      hint="고르면 위의 MBTI 연계 수치가 해당 글자 쪽으로 맞춰집니다."
                    />
                    <select
                      value={MBTI_OPTIONS.includes(draft.mbti) ? draft.mbti : ""}
                      onChange={(e) => changeMbti(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">선택</option>
                      {MBTI_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={draft.mbti}
                      onChange={(e) => changeMbti(e.target.value)}
                      placeholder="또는 직접 입력"
                      className={`${inputClass} mt-1.5`}
                    />
                  </div>
                  <div>
                    <LabelRow
                      label="D&D 성향"
                      hint="도덕·질서 축으로 행동의 방향을 잡는 데 쓰입니다."
                    />
                    <select
                      value={
                        ALIGNMENT_OPTIONS.includes(draft.alignment) ? draft.alignment : ""
                      }
                      onChange={(e) => patchDraft({ alignment: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">선택</option>
                      {ALIGNMENT_OPTIONS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={draft.alignment}
                      onChange={(e) => patchDraft({ alignment: e.target.value })}
                      placeholder="또는 직접 입력"
                      className={`${inputClass} mt-1.5`}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <LabelRow
                    label="MBTI & D&D 성향"
                    hint="의사결정·도덕 축을 보완하는 참고 지표입니다."
                  />
                  <ReadBox>
                    {display.mbti}
                    {display.alignment ? ` / ${display.alignment}` : ""}
                  </ReadBox>
                </div>
              )}
              <TextField
                label="말투 예시 및 대표 대사"
                hint="AI가 이 말투를 기반으로 대사와 혼잣말을 생성합니다."
                editing={editing}
                value={display.toneQuotes}
                onChange={(toneQuotes) => patchDraft({ toneQuotes })}
                rows={3}
                placeholder='예: "~인 모양이군.", "굳이 그런 걸 물어야 하나?"'
              />
              <TextField
                label="습관 · 버릇"
                hint="무의식적인 행동. 로그와 대사 사이사이에 묘사로 들어갑니다."
                editing={editing}
                value={display.habits}
                onChange={(habits) => patchDraft({ habits })}
                placeholder="예: 생각할 때 펜을 돌린다, 거짓말할 때 귀를 만진다"
              />
            </div>
          </div>

          {/* 생활 패턴 */}
          <div className="border-t border-[var(--line)] pt-4">
            <SectionTitle>생활 패턴</SectionTitle>
            <div className="space-y-3">
              <SleepField
                sleep={display.sleep}
                editing={editing}
                onChange={(sleep) => patchDraft({ sleep })}
              />
              <div>
                <LabelRow
                  label="소비 패턴"
                  hint="쇼핑·외식·선물 같은 지출 행동과 월말 반응에 반영됩니다."
                />
                {editing ? (
                  <div className="space-y-2">
                    <ChipInput
                      options={SPENDING_STYLE_PRESETS}
                      value={draft.spending.style}
                      onChange={(style) =>
                        patchDraft({ spending: { ...draft.spending, style } })
                      }
                      placeholder="소비 유형 직접 입력"
                    />
                    <textarea
                      rows={2}
                      value={draft.spending.note}
                      onChange={(e) =>
                        patchDraft({ spending: { ...draft.spending, note: e.target.value } })
                      }
                      placeholder="예: 옷은 안 사도 책에는 아낌없이 쓴다, 월급날엔 꼭 혼자 외식"
                      className={inputClass}
                    />
                  </div>
                ) : (
                  <ReadBox>
                    {(display.spending.style || display.spending.note) && (
                      <>
                        {display.spending.style && (
                          <span className="mr-1.5 inline-block rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--accent)]">
                            {display.spending.style}
                          </span>
                        )}
                        {display.spending.note}
                      </>
                    )}
                  </ReadBox>
                )}
              </div>
            </div>
          </div>

          {/* 과거사 */}
          <div className="border-t border-[var(--line)] pt-4">
            <SectionTitle>과거사 · 배경 서사</SectionTitle>
            <div className="space-y-3">
              {BACKSTORY_FIELDS.map((f) => (
                <TextField
                  key={f.key}
                  label={f.label}
                  hint={f.hint}
                  editing={editing}
                  value={display.backstory[f.key]}
                  onChange={(value) => patchBackstory({ [f.key]: value })}
                  rows={3}
                  placeholder={f.placeholder}
                />
              ))}
            </div>
          </div>

          {/* 취향 */}
          <div className="border-t border-[var(--line)] pt-4">
            <SectionTitle>취향 디테일</SectionTitle>
            <div className="space-y-3">
              <TextField
                label="입맛 및 식성"
                hint="식사·카페 선택지와 불만 리액션을 만들 때 참고합니다."
                editing={editing}
                value={display.foodPreference}
                onChange={(foodPreference) => patchDraft({ foodPreference })}
                placeholder="예: 초딩입맛, 매운 것 못 먹음, 민트초코 기피"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextField
                  label="좋아하는 것"
                  hint="자주 찾아가는 장소·날씨·물건. 기분이 좋아지는 상황으로 쓰입니다."
                  editing={editing}
                  value={display.likes}
                  onChange={(likes) => patchDraft({ likes })}
                  rows={3}
                  placeholder="예: 비 오는 날, 서점, 따뜻한 라떼"
                />
                <TextField
                  label="싫어하는 것"
                  hint="피하거나 짜증을 내는 상황. 스케줄을 짤 때 피하는 요소로 쓰입니다."
                  editing={editing}
                  value={display.dislikes}
                  onChange={(dislikes) => patchDraft({ dislikes })}
                  rows={3}
                  placeholder="예: 소음, 습기, 갑작스러운 약속"
                />
              </div>
              <TextField
                label="반려동물"
                hint="일상 루틴과 SNS·일기 소재로 자주 등장할 수 있습니다."
                editing={editing}
                value={display.pets}
                onChange={(pets) => patchDraft({ pets })}
                rows={1}
                placeholder="예: 검은 고양이 '나비'"
              />
            </div>
          </div>

          {/* 하위 취미 */}
          <div className="border-t border-[var(--line)] pt-4">
            <LabelRow
              label="자동 발굴된 하위 취미"
              hint="AI가 행동 로그에서 뽑아 둔 세부 취미입니다. 직접 추가·삭제할 수 있습니다."
            />
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {display.subHobbies.length === 0 && (
                <span className="text-[11px] text-[var(--muted)]">
                  등록된 하위 취미가 없습니다.
                </span>
              )}
              {display.subHobbies.map((hobby) => (
                <span
                  key={hobby}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent)]"
                >
                  {hobby}
                  {editing && (
                    <button
                      type="button"
                      onClick={() =>
                        patchDraft({
                          subHobbies: draft.subHobbies.filter((h) => h !== hobby),
                        })
                      }
                      className="rounded-full p-0.5 hover:bg-[var(--accent)]/15"
                      aria-label={`${hobby} 삭제`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editing && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={hobbyInput}
                  onChange={(e) => setHobbyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (isSubmitEnter(e)) {
                      e.preventDefault();
                      addHobby();
                    }
                  }}
                  placeholder="취미 추가 후 Enter"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={addHobby}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[var(--wash)] px-3 text-xs text-[var(--ink)] hover:bg-[var(--line)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  추가
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <WorldMembershipCard
        character={character}
        worlds={worlds}
        worldPopulation={worldPopulation}
        onMove={onMoveWorld}
      />

      <RelationshipGraph
        focus={character}
        characters={allCharacters}
        onSave={onUpdateRelationship}
      />

      <LocationPrefsPanel
        prefs={character.locationPrefs}
        onChange={(locationPrefs: LocationPreferences) => onUpdate({ locationPrefs })}
      />

      <SecretDiaryCard character={character} onPatch={onPatch} />
    </div>
  );
}
