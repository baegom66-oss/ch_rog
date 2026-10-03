"use client";

import { Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import FieldHint from "@/components/FieldHint";
import { describeSleep, TRAIT_DEFS, type TraitDef } from "@/data/profileOptions";
import type { PersonalityTraits, SleepPattern } from "@/types";

export const inputClass =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] disabled:opacity-60";

export function LabelRow({
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

export function ReadBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-[var(--wash)]/70 px-3 py-2.5 text-[13px] leading-6 text-[var(--ink)] whitespace-pre-wrap">
      {children || <span className="text-[var(--muted)]">아직 작성되지 않음</span>}
    </div>
  );
}

/** 보기 모드에선 읽기 박스, 편집 모드에선 입력칸 */
export function TextField({
  label,
  hint,
  editing,
  value,
  onChange,
  rows = 2,
  placeholder,
}: {
  label: string;
  hint?: string;
  editing: boolean;
  value: string;
  onChange: (value: string) => void;
  /** 1이면 한 줄 input */
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <LabelRow label={label} hint={hint} />
      {!editing ? (
        <ReadBox>{value}</ReadBox>
      ) : rows === 1 ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      ) : (
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </div>
  );
}

/** 프리셋 칩 + 직접 입력 */
export function ChipInput({
  options,
  value,
  onChange,
  placeholder = "직접 입력",
}: {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full px-2.5 py-1 text-[11px] transition ${
              value === option
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--wash)] text-[var(--muted)] hover:bg-[var(--line)]"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-medium tracking-wide text-[var(--accent)]">
      {children}
    </p>
  );
}

function MbtiLetter({ letter, active }: { letter: string; active: boolean }) {
  return (
    <b
      className={`inline-flex h-4 w-4 items-center justify-center rounded text-[9.5px] ${
        active ? "bg-[var(--accent)] text-white" : "bg-[var(--line)] text-[var(--muted)]"
      }`}
    >
      {letter}
    </b>
  );
}

function TraitSlider({
  def,
  value,
  editing,
  onChange,
}: {
  def: TraitDef;
  value: number;
  editing: boolean;
  onChange: (value: number) => void;
}) {
  const { mbti } = def;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--ink)]">
          {def.label}
          <FieldHint text={def.hint} />
        </span>
        <span className="text-[11px] tabular-nums text-[var(--muted)]">{value}</span>
      </div>
      {editing ? (
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
          aria-label={`${def.label} (${def.low} ↔ ${def.high})`}
        />
      ) : (
        <div className="relative h-2 rounded-full bg-[var(--line)]/70">
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--paper)] bg-[var(--accent)] shadow"
            style={{ left: `${value}%` }}
          />
        </div>
      )}
      <div className="mt-1 flex justify-between text-[10px] text-[var(--muted)]">
        <span className="inline-flex items-center gap-1">
          {mbti && <MbtiLetter letter={mbti.low} active={value < 50} />}
          {def.low}
        </span>
        <span className="inline-flex items-center gap-1">
          {def.high}
          {mbti && <MbtiLetter letter={mbti.high} active={value > 50} />}
        </span>
      </div>
    </div>
  );
}

const MBTI_TRAITS = TRAIT_DEFS.filter((d) => d.mbti);
const OTHER_TRAITS = TRAIT_DEFS.filter((d) => !d.mbti);

/** MBTI 연계 축과 그 외 축을 나눠 보여 준다 */
export function TraitSliders({
  traits,
  editing,
  onChange,
}: {
  traits: PersonalityTraits;
  editing: boolean;
  onChange: (traits: PersonalityTraits) => void;
}) {
  const renderGroup = (defs: TraitDef[]) =>
    defs.map((def) => (
      <TraitSlider
        key={def.key}
        def={def}
        value={traits[def.key]}
        editing={editing}
        onChange={(value) => onChange({ ...traits, [def.key]: value })}
      />
    ));

  return (
    <div className="space-y-3 rounded-xl bg-[var(--wash)]/70 px-3 py-3">
      <p className="text-[10px] font-medium text-[var(--accent)]">MBTI 연계</p>
      {renderGroup(MBTI_TRAITS)}
      <div className="border-t border-[var(--line)] pt-3">
        <p className="text-[10px] font-medium text-[var(--accent)]">기질 · 체력</p>
      </div>
      {renderGroup(OTHER_TRAITS)}
    </div>
  );
}

export function SleepField({
  sleep,
  editing,
  onChange,
}: {
  sleep: SleepPattern;
  editing: boolean;
  onChange: (sleep: SleepPattern) => void;
}) {
  const summary = describeSleep(sleep.bedtime, sleep.wakeTime);

  return (
    <div>
      <LabelRow
        label="수면 패턴"
        hint="취침·기상 시각은 새벽 로그, 지각, 피곤한 말투 같은 하루 흐름에 반영됩니다."
      />
      <div className="space-y-2 rounded-xl bg-[var(--wash)]/70 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-[var(--ink)]">
          <span className="inline-flex items-center gap-1.5">
            <Moon className="h-3.5 w-3.5 text-[var(--accent)]" />
            {editing ? (
              <input
                type="time"
                value={sleep.bedtime}
                onChange={(e) => onChange({ ...sleep, bedtime: e.target.value })}
                className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1 text-xs"
                aria-label="취침 시각"
              />
            ) : (
              <b className="tabular-nums">{sleep.bedtime}</b>
            )}
            취침
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sun className="h-3.5 w-3.5 text-[var(--accent)]" />
            {editing ? (
              <input
                type="time"
                value={sleep.wakeTime}
                onChange={(e) => onChange({ ...sleep, wakeTime: e.target.value })}
                className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1 text-xs"
                aria-label="기상 시각"
              />
            ) : (
              <b className="tabular-nums">{sleep.wakeTime}</b>
            )}
            기상
          </span>
          {summary && (
            <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--accent)]">
              {summary.hours}시간 · {summary.chronotype}
            </span>
          )}
        </div>
        {editing ? (
          <textarea
            rows={2}
            value={sleep.note}
            onChange={(e) => onChange({ ...sleep, note: e.target.value })}
            placeholder="예: 주말엔 오후까지 잔다, 잠들기 전 꼭 음악을 튼다"
            className={inputClass}
          />
        ) : (
          sleep.note && (
            <p className="text-[12.5px] leading-5 text-[var(--ink)]/85">{sleep.note}</p>
          )
        )}
      </div>
    </div>
  );
}
