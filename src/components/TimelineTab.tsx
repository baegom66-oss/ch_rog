"use client";

import { CalendarClock, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ActionLogCard, TimelineEditHint } from "@/components/ActionLogCard";
import CharacterStoryBar from "@/components/CharacterStoryBar";
import { FEED_LOG_LIMIT } from "@/data/dummy";
import { eventDayLabel, eventParticipants } from "@/data/events";
import { toDateKey } from "@/lib/date";
import type {
  ActionLog,
  CharacterProfile,
  ScheduleItem,
  StoryEvent,
  TimelineFilter,
} from "@/types";

interface TimelineTabProps {
  /** 현재 필터가 적용되고 최신순 정렬된 로그 */
  logs: ActionLog[];
  /** 현재 필터가 적용된 스케줄 (전체 보기에선 표시하지 않음) */
  schedules: ScheduleItem[];
  characters: CharacterProfile[];
  filter: TimelineFilter;
  onFilterChange: (value: TimelineFilter) => void;
  onAddCharacter: () => void;
  /** 캐릭터 id → 전체 로그 개수 */
  logCounts: Record<string, number>;
  favoriteCount: number;
  favoriteMax: number;
  /** 전체 세계 로그 수 (보관 한도 표시용) */
  totalLogCount: number;
  onToggleFavorite: (id: string) => void;
  onDeleteLog: (id: string) => void;
  onAddSchedule: (item: Omit<ScheduleItem, "id">) => void;
  onUpdateSchedule: (id: string, patch: Partial<ScheduleItem>) => void;
  onDeleteSchedule: (id: string) => void;
  /** 이 세계에서 오늘 진행 중인 이벤트 */
  ongoingEvents: StoryEvent[];
  onOpenEvents: () => void;
}

const SCHEDULE_PREVIEW_COUNT = 3;

function OngoingEventsStrip({
  events,
  characters,
  onOpen,
}: {
  events: StoryEvent[];
  characters: CharacterProfile[];
  onOpen: () => void;
}) {
  const today = toDateKey(new Date());
  return (
    <button
      type="button"
      onClick={onOpen}
      className="event-frame flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left transition hover:opacity-85"
    >
      <div className="min-w-0 flex-1 space-y-1">
        {events.map((event) => {
          const names = eventParticipants(event, characters).map((c) => c.name);
          return (
            <p key={event.id} className="truncate text-[12px] text-[var(--ink)]">
              <span className="mr-1">{event.emoji}</span>
              <span className="font-semibold">{event.title}</span>
              <span className="text-[var(--accent)]"> · {eventDayLabel(event, today)}</span>
              {names.length > 0 && (
                <span className="text-[var(--muted)]"> · {names.join(", ")}</span>
              )}
            </p>
          );
        })}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--accent)]" />
    </button>
  );
}

interface ScheduleSectionProps {
  character: CharacterProfile;
  schedules: ScheduleItem[];
  onAddSchedule: (item: Omit<ScheduleItem, "id">) => void;
  onUpdateSchedule: (id: string, patch: Partial<ScheduleItem>) => void;
  onDeleteSchedule: (id: string) => void;
}

function ScheduleSection({
  character,
  schedules,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
}: ScheduleSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ time: "", title: "", location: "" });
  const [adding, setAdding] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [newItem, setNewItem] = useState({
    time: "18:00",
    title: "",
    location: "",
  });

  const hiddenCount = Math.max(0, schedules.length - SCHEDULE_PREVIEW_COUNT);
  const visibleSchedules = showAll
    ? schedules
    : schedules.slice(0, SCHEDULE_PREVIEW_COUNT);

  const startEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setDraft({
      time: item.time,
      title: item.title,
      location: item.location,
    });
  };

  const saveEdit = () => {
    if (!editingId || !draft.title.trim() || !draft.location.trim()) return;
    onUpdateSchedule(editingId, draft);
    setEditingId(null);
  };

  const submitAdd = () => {
    if (!newItem.title.trim() || !newItem.location.trim()) return;
    onAddSchedule({ ...newItem, characterId: character.id });
    setNewItem({ time: "18:00", title: "", location: "" });
    setAdding(false);
  };

  return (
    <section className="feed-card px-4 py-3.5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <CalendarClock className="h-4 w-4 shrink-0 text-[var(--accent)]" />
          <h2 className="truncate font-[family-name:var(--font-display)] text-sm text-[var(--ink)]">
            {character.name}의 남은 스케줄
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--wash)] px-3 py-1.5 text-[11px] font-medium text-[var(--ink)] hover:bg-[var(--line)]"
        >
          <Plus className="h-3.5 w-3.5" />
          추가
        </button>
      </div>

      {adding && (
        <div className="mb-3 space-y-2 rounded-xl border border-dashed border-[var(--accent)]/40 bg-[var(--wash)] p-3">
          <div className="grid grid-cols-[4.5rem_1fr] gap-2">
            <input
              type="time"
              value={newItem.time}
              onChange={(e) =>
                setNewItem((s) => ({ ...s, time: e.target.value }))
              }
              className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1.5 text-xs"
            />
            <input
              type="text"
              placeholder="일정 제목"
              value={newItem.title}
              onChange={(e) =>
                setNewItem((s) => ({ ...s, title: e.target.value }))
              }
              className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1.5 text-xs"
            />
          </div>
          <input
            type="text"
            placeholder="장소"
            value={newItem.location}
            onChange={(e) =>
              setNewItem((s) => ({ ...s, location: e.target.value }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1.5 text-xs"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-lg px-3 py-1.5 text-[11px] text-[var(--muted)]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={submitAdd}
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[11px] text-white"
            >
              저장
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {schedules.length === 0 && (
          <li className="py-3 text-center text-xs text-[var(--muted)]">
            남은 스케줄이 없습니다.
          </li>
        )}
        {visibleSchedules.map((item) => (
          <li key={item.id} className="rounded-xl bg-[var(--paper)] px-3 py-2.5">
            {editingId === item.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-[4.5rem_1fr] gap-2">
                  <input
                    type="time"
                    value={draft.time}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, time: e.target.value }))
                    }
                    className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, title: e.target.value }))
                    }
                    className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1.5 text-xs"
                  />
                </div>
                <input
                  type="text"
                  value={draft.location}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, location: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1.5 text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-[11px] text-[var(--muted)]"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="rounded-lg bg-[var(--accent)] px-2.5 py-1 text-[11px] text-white"
                  >
                    적용
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tabular-nums text-[var(--accent)]">
                    {item.time}
                  </p>
                  <p className="truncate text-sm text-[var(--ink)]">
                    {item.title}
                  </p>
                  <p className="truncate text-[11px] text-[var(--muted)]">
                    {item.location}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
                    aria-label="수정"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSchedule(item.id)}
                    className="rounded-full p-1.5 text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
                    aria-label="삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 w-full rounded-full py-1.5 text-[11px] font-medium text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
        >
          {showAll ? "접기" : `스케줄 ${hiddenCount}개 더 보기`}
        </button>
      )}
    </section>
  );
}

export default function TimelineTab({
  logs,
  schedules,
  characters,
  filter,
  onFilterChange,
  onAddCharacter,
  logCounts,
  favoriteCount,
  favoriteMax,
  totalLogCount,
  onToggleFavorite,
  onDeleteLog,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  ongoingEvents,
  onOpenEvents,
}: TimelineTabProps) {
  const characterById = useMemo(
    () => new Map(characters.map((c) => [c.id, c])),
    [characters]
  );
  const filteredCharacter =
    filter === "all" ? undefined : characterById.get(filter);
  const visibleEvents = filteredCharacter
    ? ongoingEvents.filter((e) => e.participantIds.includes(filteredCharacter.id))
    : ongoingEvents;

  return (
    <div className="pb-4">
      <CharacterStoryBar
        characters={characters}
        value={filteredCharacter ? filteredCharacter.id : "all"}
        onChange={onFilterChange}
        onAddCharacter={onAddCharacter}
        logCounts={logCounts}
      />

      <div className="space-y-3 px-3 pt-3">
        {visibleEvents.length > 0 && (
          <OngoingEventsStrip
            events={visibleEvents}
            characters={characters}
            onOpen={onOpenEvents}
          />
        )}
        {filteredCharacter && (
          <ScheduleSection
            key={filteredCharacter.id}
            character={filteredCharacter}
            schedules={schedules}
            onAddSchedule={onAddSchedule}
            onUpdateSchedule={onUpdateSchedule}
            onDeleteSchedule={onDeleteSchedule}
          />
        )}

        <div className="flex items-end justify-between gap-2 px-1 pt-1">
          <div className="min-w-0">
            <h2 className="truncate font-[family-name:var(--font-display)] text-base text-[var(--ink)]">
              {filteredCharacter
                ? `${filteredCharacter.name}의 타임라인`
                : "전체 피드"}
            </h2>
            <p className="text-[11px] text-[var(--muted)]">
              {filteredCharacter
                ? `${logs.length}건 · 최신순`
                : `이 세계 캐릭터들의 소식 ${logs.length}건 · 최신순`}
              {" · "}보관함 {favoriteCount}/{favoriteMax}
            </p>
            <p className="text-[10.5px] text-[var(--muted)]">
              전체 보관 {totalLogCount}/{FEED_LOG_LIMIT} · 넘치면 오래된 기록부터 사라져요
              {favoriteCount > 0 && ` (보관함 ${favoriteCount}개는 제외)`}
            </p>
          </div>
          <TimelineEditHint />
        </div>

        {logs.length === 0 && (
          <div className="feed-card px-4 py-10 text-center text-xs text-[var(--muted)]">
            {filteredCharacter
              ? `${filteredCharacter.name}의 행동 로그가 아직 없어요.`
              : "표시할 행동 로그가 없습니다."}
          </div>
        )}
        {logs.map((log) => (
          <ActionLogCard
            key={log.id}
            log={log}
            character={characterById.get(log.characterId)}
            favoriteCount={favoriteCount}
            favoriteMax={favoriteMax}
            onToggleFavorite={onToggleFavorite}
            onDeleteLog={onDeleteLog}
          />
        ))}
      </div>
    </div>
  );
}
