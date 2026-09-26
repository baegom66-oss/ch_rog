"use client";

import {
  BookHeart,
  Lock,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import CharacterAvatar from "@/components/CharacterAvatar";
import FieldHint from "@/components/FieldHint";
import LocationPrefsPanel from "@/components/LocationPrefsPanel";
import RelationshipsPanel from "@/components/RelationshipsPanel";
import { PROFILE_OVERRIDE_UI_HINT } from "@/lib/aiSystemPrompt";
import type {
  CharacterProfile,
  CharacterRelationship,
  LocationPreferences,
  VitalStats,
} from "@/types";

interface CharacterTabProps {
  character: CharacterProfile;
  allCharacters: CharacterProfile[];
  onUpdate: (patch: Partial<CharacterProfile>) => void;
  /** 최신 프로필로 타임라인 로그 1건 즉시 생성 (테스트) */
  onGenerateTestLog: () => void;
}

const MBTI_OPTIONS = [
  "ISTJ",
  "ISFJ",
  "INFJ",
  "INTJ",
  "ISTP",
  "ISFP",
  "INFP",
  "INTP",
  "ESTP",
  "ESFP",
  "ENFP",
  "ENTP",
  "ESTJ",
  "ESFJ",
  "ENFJ",
  "ENTJ",
];

const ALIGNMENT_OPTIONS = [
  "질서 선",
  "중립 선",
  "혼돈 선",
  "질서 중립",
  "중립",
  "혼돈 중립",
  "질서 악",
  "중립 악",
  "혼돈 악",
];

const GENDER_PRESETS = ["남성", "여성", "논바이너리", "기타", "미상"];

function VitalBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-[var(--muted)]">{label}</span>
        <span className="tabular-nums font-medium text-[var(--ink)]">
          {value}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--wash)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: tone }}
        />
      </div>
    </div>
  );
}

function formatAge(age: number | null) {
  return age === null || Number.isNaN(age) ? "미상" : `${age}세`;
}

function LabelRow({
  label,
  hint,
  required,
}: {
  label: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-1 flex items-center gap-1">
      <span className="text-[11px] text-[var(--muted)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--accent)]">*</span>}
      </span>
      {hint && <FieldHint text={hint} />}
    </div>
  );
}

function ReadRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <LabelRow label={label} hint={hint} />
      <div className="rounded-xl bg-[var(--wash)]/70 px-3 py-2.5 text-[13px] leading-6 text-[var(--ink)] whitespace-pre-wrap">
        {children || (
          <span className="text-[var(--muted)]">아직 작성되지 않음</span>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] disabled:opacity-60";

export default function CharacterTab({
  character,
  allCharacters,
  onUpdate,
  onGenerateTestLog,
}: CharacterTabProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CharacterProfile>(character);
  const [hobbyInput, setHobbyInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [diaryEditing, setDiaryEditing] = useState(false);
  const [diaryDraft, setDiaryDraft] = useState(character.secretDiary);
  const [wishDraft, setWishDraft] = useState(character.wish);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditing(false);
    setDraft(character);
    setHobbyInput("");
    setNameError("");
    setDiaryEditing(false);
    setDiaryDraft(character.secretDiary);
    setWishDraft(character.wish);
  }, [character.id]);

  useEffect(() => {
    if (!editing) {
      setDraft(character);
    }
  }, [character, editing]);

  const display = editing ? draft : character;
  const vitals = character.vitals;

  const setVital = (key: keyof VitalStats, value: number) => {
    onUpdate({
      vitals: {
        ...vitals,
        [key]: Math.max(0, Math.min(100, value)),
      },
    });
  };

  const patchDraft = (patch: Partial<CharacterProfile>) => {
    setDraft((d) => ({ ...d, ...patch }));
  };

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        patchDraft({ avatarUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const addHobby = () => {
    const value = hobbyInput.trim();
    if (!value) return;
    if (draft.subHobbies.includes(value)) {
      setHobbyInput("");
      return;
    }
    patchDraft({ subHobbies: [...draft.subHobbies, value] });
    setHobbyInput("");
  };

  const removeHobby = (hobby: string) => {
    patchDraft({
      subHobbies: draft.subHobbies.filter((h) => h !== hobby),
    });
  };

  const cancelEdit = () => {
    setDraft(character);
    setEditing(false);
    setNameError("");
    setHobbyInput("");
  };

  const saveEdit = () => {
    if (!draft.name.trim()) {
      setNameError("이름은 필수입니다.");
      return;
    }
    const { vitals: _v, ...profilePatch } = draft;
    void _v;
    onUpdate({
      ...profilePatch,
      name: draft.name.trim(),
      age:
        draft.age === null || Number.isNaN(draft.age as number)
          ? null
          : draft.age,
      profileUpdatedAt: new Date().toISOString(),
    });
    setEditing(false);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1800);
  };

  return (
    <div className="space-y-5 px-4 py-4 pb-6">
      <section>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-sm text-[var(--ink)]">
          생체 수치
        </h2>
        <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <VitalBar label="허기" value={vitals.hunger} tone="#C45C26" />
          <VitalBar label="피로" value={vitals.fatigue} tone="#5B6B8A" />
          <VitalBar label="사회성" value={vitals.social} tone="#2F8A6A" />
          <VitalBar label="스트레스" value={vitals.stress} tone="#A63D4A" />
          <div className="grid grid-cols-2 gap-2 pt-1">
            {(
              [
                ["hunger", "허기"],
                ["fatigue", "피로"],
                ["social", "사회성"],
                ["stress", "스트레스"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="text-[10px] text-[var(--muted)]">
                {label} 조절
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={vitals[key]}
                  onChange={(e) => setVital(key, Number(e.target.value))}
                  className="mt-1 w-full accent-[var(--accent)]"
                />
              </label>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h2 className="font-[family-name:var(--font-display)] text-sm text-[var(--ink)]">
              상세 프로필
            </h2>
            <FieldHint text={PROFILE_OVERRIDE_UI_HINT} />
          </div>
          <div className="flex items-center gap-2">
            {savedFlash && (
              <span className="text-[10px] text-[var(--accent)]">
                currentProfile 갱신됨
              </span>
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
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--ink)] px-2.5 py-1.5 text-[11px] font-medium text-white"
                >
                  <Save className="h-3 w-3" />
                  저장
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDraft(character);
                  setEditing(true);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-[var(--wash)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--ink)] hover:bg-[var(--line)]"
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
            {new Date(character.profileUpdatedAt).toLocaleString("ko-KR")}{" "}
            · 이후 생성분부터 최신 설정 적용
          </p>
        )}

        <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
          {/* Avatar */}
          <div>
            <LabelRow
              label="캐릭터 초상화"
              hint="업로드하거나 URL을 넣으면 헤더와 프로필에 반영됩니다. 없으면 기본 이모지가 표시됩니다."
            />
            <div className="flex items-center gap-4">
              <CharacterAvatar
                url={display.avatarUrl}
                emoji={display.avatarEmoji}
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
                    onChange={(e) => handleFile(e.target.files?.[0])}
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
                    value={
                      draft.avatarUrl.startsWith("data:")
                        ? ""
                        : draft.avatarUrl
                    }
                    onChange={(e) => patchDraft({ avatarUrl: e.target.value })}
                    className={inputClass}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-[10px] text-[var(--muted)]">
                      기본 이모지
                      <input
                        type="text"
                        maxLength={4}
                        value={draft.avatarEmoji}
                        onChange={(e) =>
                          patchDraft({ avatarEmoji: e.target.value || "👤" })
                        }
                        className="mt-1 w-16 rounded-lg border border-[var(--line)] bg-[var(--wash)] px-2 py-1 text-center text-sm"
                      />
                    </label>
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
                </div>
              ) : (
                <p className="text-[11px] leading-5 text-[var(--muted)]">
                  {display.avatarUrl
                    ? "커스텀 초상화가 등록되어 있습니다."
                    : `기본 아바타 ${display.avatarEmoji}`}
                </p>
              )}
            </div>
          </div>

          {/* Basic info */}
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
                <div className="rounded-xl bg-[var(--wash)]/70 px-3 py-2.5 text-sm font-medium text-[var(--ink)]">
                  {display.name}
                </div>
              )}
            </div>

            <div>
              <LabelRow
                label="나이"
                hint="비워 두면 '미상'으로 표시됩니다."
              />
              {editing ? (
                <input
                  type="number"
                  min={0}
                  max={200}
                  placeholder="미상"
                  value={draft.age ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    patchDraft({
                      age: v === "" ? null : Number(v),
                    });
                  }}
                  className={inputClass}
                />
              ) : (
                <div className="rounded-xl bg-[var(--wash)]/70 px-3 py-2.5 text-sm text-[var(--ink)]">
                  {formatAge(display.age)}
                </div>
              )}
            </div>

            <div>
              <LabelRow
                label="성별"
                hint="선택하거나 자유롭게 입력할 수 있습니다."
              />
              {editing ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {GENDER_PRESETS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => patchDraft({ gender: g })}
                        className={`rounded-full px-2.5 py-1 text-[11px] transition ${
                          draft.gender === g
                            ? "bg-[var(--ink)] text-white"
                            : "bg-[var(--wash)] text-[var(--muted)] hover:bg-[var(--line)]"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={draft.gender}
                    onChange={(e) => patchDraft({ gender: e.target.value })}
                    placeholder="직접 입력"
                    className={inputClass}
                  />
                </div>
              ) : (
                <div className="rounded-xl bg-[var(--wash)]/70 px-3 py-2.5 text-sm text-[var(--ink)]">
                  {display.gender || "미상"}
                </div>
              )}
            </div>
          </div>

          {/* Personality */}
          <div className="border-t border-[var(--line)] pt-4">
            <p className="mb-3 text-[10px] font-medium tracking-wide text-[var(--accent)]">
              성격 및 표현 성향 · AI 행동 생성용
            </p>
            {editing ? (
              <div className="space-y-3">
                <div>
                  <LabelRow
                    label="성격 요약"
                    hint="AI가 하루 일과와 선택을 판단할 때 기준으로 삼습니다."
                  />
                  <textarea
                    rows={3}
                    value={draft.personality}
                    onChange={(e) =>
                      patchDraft({ personality: e.target.value })
                    }
                    className={inputClass}
                    placeholder="예: 냉철하고 원칙을 중시하지만 은근히 챙겨주는 스타일"
                  />
                </div>
                <div>
                  <LabelRow
                    label="말투 예시 및 대표 대사"
                    hint="AI가 이 말투를 기반으로 대사와 혼잣말을 생성합니다."
                  />
                  <textarea
                    rows={3}
                    value={draft.toneQuotes}
                    onChange={(e) =>
                      patchDraft({ toneQuotes: e.target.value })
                    }
                    className={inputClass}
                    placeholder='예: "~인 모양이군.", "굳이 그런 걸 물어야 하나?"'
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <LabelRow
                      label="MBTI"
                      hint="의사결정·사회성 패턴을 보완하는 참고 지표입니다."
                    />
                    <select
                      value={draft.mbti}
                      onChange={(e) => patchDraft({ mbti: e.target.value })}
                      className={inputClass}
                    >
                      {MBTI_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={draft.mbti}
                      onChange={(e) => patchDraft({ mbti: e.target.value })}
                      placeholder="또는 직접 입력"
                      className={`${inputClass} mt-1.5`}
                    />
                  </div>
                  <div>
                    <LabelRow
                      label="D&D 성향"
                      hint="도덕·질서 축으로 행동의 방향을 잡는 데 쓰입니다. 예: ISTJ / 질서 중립"
                    />
                    <select
                      value={
                        ALIGNMENT_OPTIONS.includes(draft.alignment)
                          ? draft.alignment
                          : ""
                      }
                      onChange={(e) =>
                        patchDraft({ alignment: e.target.value })
                      }
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
                      onChange={(e) =>
                        patchDraft({ alignment: e.target.value })
                      }
                      placeholder="또는 직접 입력"
                      className={`${inputClass} mt-1.5`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <ReadRow
                  label="성격 요약"
                  hint="AI가 하루 일과와 선택을 판단할 때 기준으로 삼습니다."
                >
                  {display.personality}
                </ReadRow>
                <ReadRow
                  label="말투 예시 및 대표 대사"
                  hint="AI가 이 말투를 기반으로 대사와 혼잣말을 생성합니다."
                >
                  {display.toneQuotes}
                </ReadRow>
                <ReadRow
                  label="MBTI & D&D 성향"
                  hint="의사결정·도덕 축을 보완하는 참고 지표입니다."
                >
                  {display.mbti}
                  {display.alignment ? ` / ${display.alignment}` : ""}
                </ReadRow>
              </div>
            )}
          </div>

          {/* Narrative */}
          <div className="border-t border-[var(--line)] pt-4">
            <p className="mb-3 text-[10px] font-medium tracking-wide text-[var(--accent)]">
              서사 및 취향 디테일
            </p>
            {editing ? (
              <div className="space-y-3">
                <div>
                  <LabelRow
                    label="과거사 / 배경 서사"
                    hint="트라우마·자라온 환경 등. 장기 서사와 관계 반응에 반영됩니다."
                  />
                  <textarea
                    rows={4}
                    value={draft.backstory}
                    onChange={(e) => patchDraft({ backstory: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <LabelRow
                    label="입맛 및 식성"
                    hint="식사·카페 선택지와 불만 리액션을 만들 때 참고합니다."
                  />
                  <textarea
                    rows={2}
                    value={draft.foodPreference}
                    onChange={(e) =>
                      patchDraft({ foodPreference: e.target.value })
                    }
                    className={inputClass}
                    placeholder="예: 초딩입맛, 매운 것 못 먹음, 민트초코 기피"
                  />
                </div>
                <div>
                  <LabelRow
                    label="선호 / 기피 요소"
                    hint="장소·날씨·사람 밀도 등 환경 선호를 스케줄에 반영합니다."
                  />
                  <textarea
                    rows={2}
                    value={draft.likesDislikes}
                    onChange={(e) =>
                      patchDraft({ likesDislikes: e.target.value })
                    }
                    className={inputClass}
                    placeholder="예: 좋아함: 비 오는 날, 서점 / 싫어함: 소음, 습기"
                  />
                </div>
                <div>
                  <LabelRow
                    label="반려동물"
                    hint="일상 루틴과 SNS·일기 소재로 자주 등장할 수 있습니다."
                  />
                  <input
                    type="text"
                    value={draft.pets}
                    onChange={(e) => patchDraft({ pets: e.target.value })}
                    className={inputClass}
                    placeholder="예: 검은 고양이 '나비'"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <ReadRow
                  label="과거사 / 배경 서사"
                  hint="트라우마·자라온 환경 등. 장기 서사와 관계 반응에 반영됩니다."
                >
                  {display.backstory}
                </ReadRow>
                <ReadRow
                  label="입맛 및 식성"
                  hint="식사·카페 선택지와 불만 리액션을 만들 때 참고합니다."
                >
                  {display.foodPreference}
                </ReadRow>
                <ReadRow
                  label="선호 / 기피 요소"
                  hint="장소·날씨·사람 밀도 등 환경 선호를 스케줄에 반영합니다."
                >
                  {display.likesDislikes}
                </ReadRow>
                <ReadRow
                  label="반려동물"
                  hint="일상 루틴과 SNS·일기 소재로 자주 등장할 수 있습니다."
                >
                  {display.pets}
                </ReadRow>
              </div>
            )}
          </div>

          {/* Sub hobbies */}
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
                      onClick={() => removeHobby(hobby)}
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
                    if (e.key === "Enter") {
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

        <div className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-[var(--accent)]" />
            <p className="text-xs font-semibold text-[var(--ink)]">
              Instant Override 테스트
            </p>
            <FieldHint text="저장 직후의 currentProfile만으로 타임라인 카드 1개를 만듭니다. 과거 로그 맥락은 참조하지 않습니다." />
          </div>
          <p className="mb-3 text-[11px] leading-5 text-[var(--muted)]">
            성격·말투를 바꾼 뒤 저장하고, 아래 버튼으로 변경이 즉시 반영된
            로그가 생기는지 확인해 보세요. 생성 후 타임라인 탭으로 이동합니다.
          </p>
          <button
            type="button"
            onClick={onGenerateTestLog}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] py-2.5 text-xs font-medium text-white hover:opacity-95"
          >
            <Zap className="h-3.5 w-3.5" />
            프로필 수정 후 즉시 로그 생성 테스트
          </button>
        </div>
      </section>

      <RelationshipsPanel
        character={character}
        allCharacters={allCharacters}
        onChange={(relationships: CharacterRelationship[]) =>
          onUpdate({ relationships })
        }
      />

      <LocationPrefsPanel
        prefs={character.locationPrefs}
        onChange={(locationPrefs: LocationPreferences) =>
          onUpdate({ locationPrefs })
        }
      />

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-[var(--accent)]" />
          <h2 className="font-[family-name:var(--font-display)] text-sm text-[var(--ink)]">
            관찰자 전용 비밀 일기
          </h2>
          <span className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] text-[var(--accent)]">
            하루 1회
          </span>
          <FieldHint text="마음에 들지 않거나 캐릭터성에 맞지 않는 일기는 언제든 삭제 및 수정할 수 있습니다. 소원은 시설 해금 힌트로 연결될 수 있습니다." />
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
              <BookHeart className="h-3.5 w-3.5" />
              오직 유저만 읽을 수 있는 속마음
            </div>
            <div className="flex items-center gap-1">
              {!diaryEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setDiaryDraft(character.secretDiary);
                      setWishDraft(character.wish);
                      setDiaryEditing(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
                  >
                    <Pencil className="h-3 w-3" />
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "이 비밀 일기를 삭제하시겠습니까?\n소원 문구는 유지됩니다."
                        )
                      ) {
                        onUpdate({ secretDiary: "" });
                        setDiaryEditing(false);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-red-600/80 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    삭제
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setDiaryEditing(false)}
                    className="px-2 py-1 text-[10px] text-[var(--muted)]"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdate({
                        secretDiary: diaryDraft,
                        wish: wishDraft,
                      });
                      setDiaryEditing(false);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-[var(--ink)] px-2 py-1 text-[10px] text-white"
                  >
                    <Save className="h-3 w-3" />
                    저장
                  </button>
                </>
              )}
            </div>
          </div>
          {diaryEditing ? (
            <textarea
              rows={6}
              value={diaryDraft}
              onChange={(e) => setDiaryDraft(e.target.value)}
              className="w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-3 font-[family-name:var(--font-display)] text-[13px] leading-7 text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              placeholder="오늘의 속마음을 적어 주세요."
            />
          ) : (
            <div className="min-h-[6rem] rounded-xl bg-[var(--wash)]/70 px-3 py-3 font-[family-name:var(--font-display)] text-[13px] leading-7 text-[var(--ink)] whitespace-pre-wrap">
              {character.secretDiary.trim() ? (
                character.secretDiary
              ) : (
                <span className="text-[var(--muted)]">
                  삭제되었거나 아직 작성된 일기가 없습니다.
                </span>
              )}
            </div>
          )}
          <div className="mt-3 rounded-xl border border-dashed border-[var(--accent)]/35 bg-[var(--accent-soft)]/50 px-3 py-3">
            <p className="mb-1 text-[10px] font-medium tracking-wide text-[var(--accent)]">
              오늘의 소원
            </p>
            {diaryEditing ? (
              <textarea
                rows={2}
                value={wishDraft}
                onChange={(e) => setWishDraft(e.target.value)}
                className="w-full resize-none bg-transparent text-[12.5px] leading-6 text-[var(--ink)] outline-none"
                placeholder="캐릭터가 바라는 소원을 적어 주세요."
              />
            ) : (
              <p className="text-[12.5px] leading-6 text-[var(--ink)] whitespace-pre-wrap">
                {character.wish.trim() || (
                  <span className="text-[var(--muted)]">소원이 비어 있습니다.</span>
                )}
              </p>
            )}
          </div>
          <p className="mt-2 text-[10px] text-[var(--muted)]">
            마음에 들지 않거나 캐릭터성에 맞지 않는 일기는 언제든 삭제·수정할 수
            있습니다.
          </p>
        </div>
      </section>
    </div>
  );
}
