"use client";

import { Globe, Plus } from "lucide-react";
import type { ReactNode } from "react";
import CharacterAvatar from "@/components/CharacterAvatar";
import type { CharacterProfile, TimelineFilter } from "@/types";

interface CharacterStoryBarProps {
  characters: CharacterProfile[];
  value: TimelineFilter;
  onChange: (value: TimelineFilter) => void;
  /** 캐릭터 id → 로그 개수 */
  logCounts: Record<string, number>;
  onAddCharacter?: () => void;
  /** 맨 앞 [전체 보기] 항목 표시 여부 */
  showAll?: boolean;
}

function StoryRing({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`flex rounded-full p-[2.5px] transition ${
        active ? "" : "bg-[var(--line)]"
      }`}
      style={active ? { background: "var(--story-ring)" } : undefined}
    >
      <span className="flex rounded-full bg-[var(--card)] p-[2px]">
        {children}
      </span>
    </span>
  );
}

export default function CharacterStoryBar({
  characters,
  value,
  onChange,
  logCounts,
  onAddCharacter,
  showAll = true,
}: CharacterStoryBarProps) {
  const allActive = value === "all";

  return (
    <div className="border-b border-[var(--line)] bg-[var(--card)]">
      <div
        className="no-scrollbar flex gap-3.5 overflow-x-auto px-4 py-3"
        role="tablist"
        aria-label="캐릭터 선택"
      >
        {showAll && (
          <button
            type="button"
            role="tab"
            aria-selected={allActive}
            onClick={() => onChange("all")}
            className="flex w-[4.25rem] shrink-0 flex-col items-center gap-1.5"
          >
            <StoryRing active={allActive}>
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
                  allActive
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--wash)] text-[var(--muted)]"
                }`}
              >
                <Globe className="h-6 w-6" strokeWidth={1.75} />
              </span>
            </StoryRing>
            <span
              className={`w-full truncate text-center text-[11px] ${
                allActive
                  ? "font-semibold text-[var(--ink)]"
                  : "text-[var(--muted)]"
              }`}
            >
              전체 보기
            </span>
          </button>
        )}

        {characters.map((c) => {
          const active = value === c.id;
          const count = logCounts[c.id] ?? 0;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(c.id)}
              className="flex w-[4.25rem] shrink-0 flex-col items-center gap-1.5"
            >
              <span className="relative">
                <StoryRing active={active}>
                  <CharacterAvatar
                    url={c.avatarUrl}
                    color={c.avatarColor}
                    name={c.name}
                    size="story"
                    className="shadow-none! ring-0!"
                  />
                </StoryRing>
                {count > 0 && (
                  <span className="absolute -right-0.5 bottom-0 min-w-[1.25rem] rounded-full border-2 border-[var(--card)] bg-[var(--point)] px-1 text-center text-[10px] font-bold leading-4 text-[var(--ink)] tabular-nums">
                    {count}
                  </span>
                )}
              </span>
              <span
                className={`w-full truncate text-center text-[11px] ${
                  active
                    ? "font-semibold text-[var(--ink)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {c.name}
              </span>
            </button>
          );
        })}

        {onAddCharacter && (
          <button
            type="button"
            onClick={onAddCharacter}
            className="flex w-[4.25rem] shrink-0 flex-col items-center gap-1.5"
          >
            <span className="flex rounded-full p-[2.5px]">
              <span className="flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full border-2 border-dashed border-[var(--line)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                <Plus className="h-5 w-5" />
              </span>
            </span>
            <span className="w-full truncate text-center text-[11px] text-[var(--muted)]">
              추가
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
