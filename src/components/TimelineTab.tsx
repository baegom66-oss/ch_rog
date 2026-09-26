"use client";

import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ActionLogCard, TimelineEditHint } from "@/components/ActionLogCard";
import type { ActionLog, ScheduleItem } from "@/types";

interface TimelineTabProps {
  logs: ActionLog[];
  schedules: ScheduleItem[];
  favoriteCount: number;
  favoriteMax: number;
  onToggleFavorite: (id: string) => void;
  onUpdateLog: (id: string, patch: Partial<ActionLog>) => void;
  onDeleteLog: (id: string) => void;
  onAddSchedule: (item: Omit<ScheduleItem, "id" | "characterId">) => void;
  onUpdateSchedule: (id: string, patch: Partial<ScheduleItem>) => void;
  onDeleteSchedule: (id: string) => void;
}

export default function TimelineTab({
  logs,
  schedules,
  favoriteCount,
  favoriteMax,
  onToggleFavorite,
  onUpdateLog,
  onDeleteLog,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
}: TimelineTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ time: "", title: "", location: "" });
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    time: "18:00",
    title: "",
    location: "",
  });

  const startEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setDraft({
      time: item.time,
      title: item.title,
      location: item.location,
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    onUpdateSchedule(editingId, draft);
    setEditingId(null);
  };

  const submitAdd = () => {
    if (!newItem.title.trim() || !newItem.location.trim()) return;
    onAddSchedule(newItem);
    setNewItem({ time: "18:00", title: "", location: "" });
    setAdding(false);
  };

  return (
    <div className="pb-4">
      <section className="border-b border-[var(--line)] px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="font-[family-name:var(--font-display)] text-sm text-[var(--ink)]">
              오늘의 남은 스케줄
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--wash)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--ink)] hover:bg-[var(--line)]"
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
                className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-xs"
              />
              <input
                type="text"
                placeholder="일정 제목"
                value={newItem.title}
                onChange={(e) =>
                  setNewItem((s) => ({ ...s, title: e.target.value }))
                }
                className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-xs"
              />
            </div>
            <input
              type="text"
              placeholder="장소"
              value={newItem.location}
              onChange={(e) =>
                setNewItem((s) => ({ ...s, location: e.target.value }))
              }
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-xs"
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
                className="rounded-lg bg-[var(--ink)] px-3 py-1.5 text-[11px] text-white"
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
          {schedules.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5"
            >
              {editingId === item.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-[4.5rem_1fr] gap-2">
                    <input
                      type="time"
                      value={draft.time}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, time: e.target.value }))
                      }
                      className="rounded-lg border border-[var(--line)] bg-[var(--wash)] px-2 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, title: e.target.value }))
                      }
                      className="rounded-lg border border-[var(--line)] bg-[var(--wash)] px-2 py-1.5 text-xs"
                    />
                  </div>
                  <input
                    type="text"
                    value={draft.location}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, location: e.target.value }))
                    }
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--wash)] px-2 py-1.5 text-xs"
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
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
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
                      className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
                      aria-label="수정"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSchedule(item.id)}
                      className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
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
      </section>

      <section>
        <div className="border-b border-[var(--line)] bg-[var(--paper)]/95 px-4 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-sm text-[var(--ink)]">
              실시간 행동 로그
            </h2>
            <TimelineEditHint />
          </div>
          <p className="text-[11px] text-[var(--muted)]">
            보관함 {favoriteCount}/{favoriteMax} · 카드 ⋯ 메뉴에서 수정/삭제
          </p>
        </div>
        {logs.length === 0 && (
          <p className="px-4 py-8 text-center text-xs text-[var(--muted)]">
            표시할 행동 로그가 없습니다.
          </p>
        )}
        {logs.map((log) => (
          <ActionLogCard
            key={log.id}
            log={log}
            favoriteCount={favoriteCount}
            favoriteMax={favoriteMax}
            onToggleFavorite={onToggleFavorite}
            onUpdateLog={onUpdateLog}
            onDeleteLog={onDeleteLog}
          />
        ))}
      </section>
    </div>
  );
}
