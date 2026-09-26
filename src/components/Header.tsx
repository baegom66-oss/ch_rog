"use client";

import { Leaf, Pause, Play, Plus, Settings2 } from "lucide-react";
import CharacterAvatar from "@/components/CharacterAvatar";
import { formatOfflineModeBadge } from "@/data/offlineLogSettings";
import type {
  CharacterProfile,
  OfflineLogFrequency,
  SpeedMode,
} from "@/types";

interface HeaderProps {
  characters: CharacterProfile[];
  selectedId: string;
  onSelectCharacter: (id: string) => void;
  speed: SpeedMode;
  onSpeedChange: (speed: SpeedMode) => void;
  favoriteCount: number;
  favoriteMax: number;
  offlineFrequency: OfflineLogFrequency;
  onOpenOfflineSettings: () => void;
  onOpenFavorites: () => void;
  onOpenAddCharacter: () => void;
}

const SPEEDS: { value: SpeedMode; label: string }[] = [
  { value: 0, label: "일시정지" },
  { value: 1, label: "1배속" },
  { value: 5, label: "5배속" },
  { value: 20, label: "20배속" },
];

export default function Header({
  characters,
  selectedId,
  onSelectCharacter,
  speed,
  onSpeedChange,
  favoriteCount,
  favoriteMax,
  offlineFrequency,
  onOpenOfflineSettings,
  onOpenFavorites,
  onOpenAddCharacter,
}: HeaderProps) {
  const selected = characters.find((c) => c.id === selectedId) ?? characters[0];

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg flex-col gap-3 px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-[family-name:var(--font-display)] text-[11px] tracking-[0.18em] text-[var(--muted)]">
              OC 관찰 일기
            </p>
            <div className="mt-1.5 flex items-center gap-2.5">
              <CharacterAvatar
                url={selected.avatarUrl}
                emoji={selected.avatarEmoji}
                color={selected.avatarColor}
                name={selected.name}
                size="sm"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
                    {selected.name}
                  </h1>
                  <span className="rounded-md bg-[var(--wash)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
                    {selected.mbti}
                    {selected.alignment ? ` · ${selected.alignment}` : ""}
                  </span>
                </div>
                <p className="truncate text-xs text-[var(--muted)]">
                  {selected.currentLocation} · {selected.currentAction}
                </p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <button
              type="button"
              onClick={onOpenFavorites}
              className="rounded-lg bg-[var(--wash)] px-2.5 py-1.5 text-right transition hover:bg-[var(--accent-soft)]"
              title="보관함 열기"
            >
              <p className="text-[10px] text-[var(--muted)]">보관함</p>
              <p className="text-sm font-semibold tabular-nums text-[var(--accent)]">
                {favoriteCount}/{favoriteMax}
              </p>
            </button>
            <button
              type="button"
              onClick={onOpenOfflineSettings}
              className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
              aria-label="오프라인 로그 설정"
              title="오프라인 로그 설정"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenOfflineSettings}
          className="flex w-full items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--wash)]/80 px-3 py-2 text-left transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]/40"
        >
          <Leaf className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
          <span className="min-w-0 flex-1 truncate text-[11px] text-[var(--ink)]">
            {formatOfflineModeBadge(offlineFrequency)}
          </span>
          <span className="shrink-0 text-[10px] text-[var(--muted)]">변경</span>
        </button>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {characters.map((c) => {
            const active = c.id === selectedId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCharacter(c.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${
                  active
                    ? "bg-[var(--ink)] text-white"
                    : "bg-[var(--wash)] text-[var(--muted)] hover:bg-[var(--line)]"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: active ? "#fff" : c.avatarColor }}
                />
                {c.name}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onOpenAddCharacter}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-[var(--line)] px-3 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <Plus className="h-3.5 w-3.5" />
            추가
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-[var(--wash)] p-1">
          {SPEEDS.map((s) => {
            const active = speed === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => onSpeedChange(s.value)}
                className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition ${
                  active
                    ? "bg-[var(--paper)] text-[var(--ink)] shadow-sm"
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
      </div>
    </header>
  );
}
