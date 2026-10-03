"use client";

import { Leaf, Pause, Play } from "lucide-react";
import { OFFLINE_LOG_OPTIONS } from "@/data/offlineLogSettings";
import type { OfflineLogFrequency, SpeedMode } from "@/types";

const SPEED_OPTIONS: { value: SpeedMode; label: string }[] = [
  { value: 0, label: "일시정지" },
  { value: 1, label: "1배속" },
  { value: 5, label: "5배속" },
  { value: 20, label: "20배속" },
];

/** value가 null이면 (세계마다 값이 달라) 아무것도 선택되지 않은 상태 */
export function SpeedSelector({
  value,
  onChange,
}: {
  value: SpeedMode | null;
  onChange: (speed: SpeedMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-[var(--wash)] p-1">
      {SPEED_OPTIONS.map((s) => {
        const active = value === s.value;
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => onChange(s.value)}
            aria-pressed={active}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-[12px] font-medium transition ${
              active
                ? "bg-[var(--card)] text-[var(--ink)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {s.value === 0 ? (
              <Pause className="h-3 w-3" />
            ) : active ? (
              <Play className="h-3 w-3" />
            ) : null}
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

/** value가 null이면 (세계마다 값이 달라) 아무것도 선택되지 않은 상태 */
export function OfflineFrequencyOptions({
  name,
  value,
  onChange,
}: {
  /** 라디오 그룹 이름 (한 화면에 여러 개일 때 구분) */
  name: string;
  value: OfflineLogFrequency | null;
  onChange: (value: OfflineLogFrequency) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">오프라인 생성 빈도</legend>
      {OFFLINE_LOG_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <label
            key={opt.value}
            className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-3 transition ${
              active
                ? "border-[var(--accent)] bg-[var(--accent-soft)]/60"
                : "border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--wash)]"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={active}
              onChange={() => onChange(opt.value)}
              className="mt-1 accent-[var(--accent)]"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-[var(--ink)]">
                {opt.label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-5 text-[var(--muted)]">
                {opt.intervalHint}
              </span>
              {active && (
                <span className="mt-2 flex items-start gap-1.5 rounded-lg bg-[var(--paper)]/80 px-2.5 py-2 text-[11px] leading-5 text-[var(--accent)]">
                  <Leaf className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {opt.storageHint}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
