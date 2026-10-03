"use client";

import { Check, ChevronDown, Loader2, Plus, Settings2, Sparkles } from "lucide-react";
import { useState } from "react";
import CharacterAvatar from "@/components/CharacterAvatar";
import {
  populationOf,
  TOTAL_CHARACTER_LIMIT,
  totalPopulation,
  WORLD_CHARACTER_LIMIT,
  type WorldPopulation,
} from "@/data/worlds";
import { eventSpotName, eventSpotOn } from "@/data/events";
import { toDateKey } from "@/lib/date";
import type { CharacterProfile, StoryEvent, World } from "@/types";

interface HeaderProps {
  worlds: World[];
  currentWorld: World;
  worldPopulation: WorldPopulation;
  onSelectWorld: (id: string) => void;
  /** 현재 세계의 캐릭터만 */
  characters: CharacterProfile[];
  selectedId: string;
  onSelectCharacter: (id: string) => void;
  favoriteCount: number;
  favoriteMax: number;
  onOpenSettings: () => void;
  onOpenFavorites: () => void;
  onOpenAddCharacter: () => void;
  /** true면 상단 바만 표시 (선택 캐릭터 프로필·캐릭터 칩 숨김) */
  minimal?: boolean;
  showFavorites?: boolean;
  /** 선택된 캐릭터가 오늘 참여 중인 이벤트 */
  selectedEvent?: StoryEvent;
  /** "on" 키 등록·사용 중, "off" 키는 있지만 꺼둠, "none" 키 없음 */
  aiState: "on" | "off" | "none";
  aiPending: number;
  aiHasError: boolean;
  onOpenAiSettings: () => void;
}

function AiChip({
  aiState,
  aiPending,
  aiHasError,
  onOpenAiSettings,
}: Pick<HeaderProps, "aiState" | "aiPending" | "aiHasError" | "onOpenAiSettings">) {
  const label =
    aiState === "none" ? "AI 키 입력" : aiState === "off" ? "AI 꺼짐" : aiPending > 0 ? `AI 작성 중 ${aiPending}` : "AI";
  const tone =
    aiState === "on"
      ? aiHasError
        ? "bg-red-50 text-red-600"
        : "bg-[var(--light-violet)] text-[var(--main)]"
      : "bg-[var(--wash)] text-[var(--muted)]";
  return (
    <button
      type="button"
      onClick={onOpenAiSettings}
      className={`relative inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition hover:opacity-80 ${tone}`}
      title={aiHasError && aiState === "on" ? "최근 AI 생성에 실패했어요 · 설정에서 확인" : "Gemini AI 연동 설정"}
    >
      {aiPending > 0 && aiState === "on" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      {label}
      {aiState === "on" && !aiHasError && (
        <span
          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--point)]"
          aria-hidden
        />
      )}
    </button>
  );
}

function WorldSwitcher({
  worlds,
  currentWorld,
  worldPopulation,
  onSelectWorld,
}: Pick<HeaderProps, "worlds" | "currentWorld" | "worldPopulation" | "onSelectWorld">) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex max-w-full items-center gap-1 rounded-full bg-[var(--wash)] py-1 pl-2 pr-1.5 text-[11px] font-medium text-[var(--ink)] transition hover:bg-[var(--line)]"
        aria-haspopup="listbox"
        aria-expanded={open}
        title="세계 바꾸기"
      >
        <span className="truncate">{currentWorld.name}</span>
        <ChevronDown className={`h-3 w-3 shrink-0 text-[var(--muted)] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-label="세계 목록 닫기"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            aria-label="세계 선택"
            className="absolute left-0 top-full z-40 mt-1.5 max-h-72 w-60 overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-1.5 shadow-lg"
          >
            {worlds.map((w) => {
              const active = w.id === currentWorld.id;
              return (
                <li key={w.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onSelectWorld(w.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition ${
                      active ? "bg-[var(--accent-soft)]/60" : "hover:bg-[var(--wash)]"
                    }`}
                  >
                    <span className="text-base">{w.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-[var(--ink)]">{w.name}</span>
                      <span className="block text-[10px] tabular-nums text-[var(--muted)]">
                        캐릭터 {populationOf(worldPopulation, w.id)}/{WORLD_CHARACTER_LIMIT}
                        {w.timeline.speed === 0 ? " · 일시정지" : ""}
                      </span>
                    </span>
                    {active && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export default function Header({
  worlds,
  currentWorld,
  worldPopulation,
  onSelectWorld,
  characters,
  selectedId,
  onSelectCharacter,
  favoriteCount,
  favoriteMax,
  onOpenSettings,
  onOpenFavorites,
  onOpenAddCharacter,
  minimal = false,
  showFavorites = true,
  selectedEvent,
  aiState,
  aiPending,
  aiHasError,
  onOpenAiSettings,
}: HeaderProps) {
  const selected = characters.find((c) => c.id === selectedId) ?? characters[0];
  const full =
    characters.length >= WORLD_CHARACTER_LIMIT ||
    totalPopulation(worldPopulation) >= TOTAL_CHARACTER_LIMIT;

  return (
    <header className="soft-gradient border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="mx-auto flex max-w-lg flex-col gap-3 px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <p className="shrink-0 rounded-md bg-[var(--point)] px-1.5 py-0.5 font-[family-name:var(--font-title)] text-[14px] leading-tight tracking-[0.02em] text-[var(--strong)] [-webkit-text-stroke:0]">
              OC 관찰 일기
            </p>
            <WorldSwitcher
              worlds={worlds}
              currentWorld={currentWorld}
              worldPopulation={worldPopulation}
              onSelectWorld={onSelectWorld}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <AiChip
              aiState={aiState}
              aiPending={aiPending}
              aiHasError={aiHasError}
              onOpenAiSettings={onOpenAiSettings}
            />
            {showFavorites && (
              <button
                type="button"
                onClick={onOpenFavorites}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--wash)] px-3 py-1.5 text-[11px] transition hover:bg-[var(--accent-soft)]"
                title="보관함 열기"
              >
                <span className="text-[var(--muted)]">보관함</span>
                <span className="rounded-full bg-[var(--point)] px-1.5 font-semibold tabular-nums text-[var(--strong)]">
                  {favoriteCount}/{favoriteMax}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenSettings}
              className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
              aria-label="설정"
              title="설정"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!minimal && (
          <>
            {selected ? (
              <div className="flex items-center gap-2.5">
                <CharacterAvatar
                  url={selected.avatarUrl}
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
                  {selectedEvent ? (
                    <p className="truncate text-xs text-[var(--accent)]">
                      {selectedEvent.emoji} {selectedEvent.title} 참여 중 ·{" "}
                      {eventSpotName(selectedEvent, eventSpotOn(selectedEvent, toDateKey(new Date())))}
                    </p>
                  ) : (
                    <p className="truncate text-xs text-[var(--muted)]">
                      {selected.currentLocation} · {selected.currentAction}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)]">
                {currentWorld.emoji} {currentWorld.name}에는 아직 아무도 살지 않아요.
              </p>
            )}

            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {characters.map((c) => {
                const active = c.id === selected?.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectCharacter(c.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${
                      active
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--wash)] text-[var(--muted)] hover:bg-[var(--line)]"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: active ? "#fff" : c.avatarColor,
                      }}
                    />
                    {c.name}
                  </button>
                );
              })}
              {!full && (
                <button
                  type="button"
                  onClick={onOpenAddCharacter}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-[var(--line)] px-3 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  추가
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
