"use client";

import { Database, Leaf, X } from "lucide-react";
import {
  formatOfflineModeBadge,
  getOfflineLogOption,
  OFFLINE_LOG_OPTIONS,
} from "@/data/offlineLogSettings";
import type { OfflineLogFrequency } from "@/types";

interface OfflineLogSettingsPanelProps {
  value: OfflineLogFrequency;
  characterCount: number;
  onChange: (value: OfflineLogFrequency) => void;
  onClose: () => void;
}

export default function OfflineLogSettingsPanel({
  value,
  characterCount,
  onChange,
  onClose,
}: OfflineLogSettingsPanelProps) {
  const selected = getOfflineLogOption(value);
  const estimatedDaily =
    selected.logsPerDay === 0
      ? 0
      : selected.logsPerDay * Math.max(characterCount, 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--ink)]/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-t-2xl bg-[var(--paper)] shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="offline-log-settings-title"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <div>
            <p
              id="offline-log-settings-title"
              className="text-sm font-semibold text-[var(--ink)]"
            >
              오프라인 로그 생성 빈도
            </p>
            <p className="text-[11px] text-[var(--muted)]">
              미접속 중 쌓이는 행동 로그 양을 조절합니다
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--wash)]"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(85vh-4rem)] space-y-3 overflow-y-auto px-4 py-4">
          <fieldset className="space-y-2">
            <legend className="sr-only">빈도 선택</legend>
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
                    name="offline-log-frequency"
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

          <div className="rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--ink)]">
              <Database className="h-3.5 w-3.5 text-[var(--accent)]" />
              예상 일일 저장량
            </div>
            <p className="mt-1.5 text-[12.5px] leading-5 text-[var(--ink)]/85">
              {estimatedDaily === 0 ? (
                <>
                  미접속 시 로그 0건 · 현재 캐릭터 {characterCount}명 기준,
                  오프라인 구간에는 DB에 쌓이지 않습니다.
                </>
              ) : (
                <>
                  캐릭터 {characterCount}명 × {selected.logsPerDay}건 ≈{" "}
                  <strong className="font-semibold text-[var(--accent)]">
                    하루 약 {estimatedDaily}건
                  </strong>{" "}
                 의 오프라인 로그가 생성될 수 있습니다.
                </>
              )}
            </p>
            <p className="mt-1.5 text-[10px] text-[var(--muted)]">
              현재: {formatOfflineModeBadge(value)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
