"use client";

import {
  MapPinned,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Search,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import FieldHint from "@/components/FieldHint";
import type { ActionLog } from "@/types";

interface LogDetailModalProps {
  log: ActionLog;
  onClose: () => void;
  onSaveDetail: (detail: string) => void;
}

export function LogDetailModal({
  log,
  onClose,
  onSaveDetail,
}: LogDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(log.detail);

  useEffect(() => {
    setDraft(log.detail);
    setEditing(false);
  }, [log.id, log.detail]);

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
        aria-labelledby="log-detail-title"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <div>
            <p
              id="log-detail-title"
              className="text-sm font-semibold text-[var(--ink)]"
            >
              상세 기록
            </p>
            <p className="text-xs text-[var(--muted)]">
              {log.time} · {log.location}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
              >
                <Pencil className="h-3.5 w-3.5" />
                수정
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(log.detail);
                    setEditing(false);
                  }}
                  className="px-2 py-1.5 text-[11px] text-[var(--muted)]"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSaveDetail(draft);
                    setEditing(false);
                  }}
                  className="rounded-lg bg-[var(--ink)] px-2.5 py-1.5 text-[11px] text-white"
                >
                  저장
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--wash)]"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="max-h-[calc(85vh-4rem)] space-y-3 overflow-y-auto px-4 py-4">
          {(log.contextNote ||
            (log.companionNames && log.companionNames.length > 0) ||
            (log.placeTags && log.placeTags.length > 0)) && (
            <div className="rounded-xl border border-[var(--accent)]/25 bg-[var(--accent-soft)]/50 px-3 py-2.5">
              {log.contextNote && (
                <p className="flex items-start gap-1.5 text-[12.5px] leading-5 text-[var(--ink)]">
                  {log.companionNames && log.companionNames.length > 0 ? (
                    <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                  ) : (
                    <MapPinned className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                  )}
                  {log.contextNote}
                </p>
              )}
              {log.placeTags && log.placeTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {log.placeTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-[var(--paper)] px-1.5 py-0.5 text-[10px] text-[var(--accent)]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {editing ? (
            <textarea
              rows={14}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-3 font-[family-name:var(--font-display)] text-[13px] leading-7 text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            />
          ) : (
            <pre className="whitespace-pre-wrap font-[family-name:var(--font-display)] text-[13px] leading-7 text-[var(--ink)]">
              {log.detail}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

interface LogEditModalProps {
  log: ActionLog;
  onClose: () => void;
  onSave: (patch: Partial<ActionLog>) => void;
}

function LogEditModal({ log, onClose, onSave }: LogEditModalProps) {
  const [draft, setDraft] = useState({
    time: log.time,
    location: log.location,
    summary: log.summary,
    innerThought: log.innerThought,
    detail: log.detail,
    contextNote: log.contextNote ?? "",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--ink)]/40 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-t-2xl bg-[var(--paper)] shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">로그 수정</p>
            <p className="text-[11px] text-[var(--muted)]">
              요약·속마음·상세 대사를 캐릭터성에 맞게 다듬을 수 있어요
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
        <div className="max-h-[calc(85vh-7rem)] space-y-3 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-[5rem_1fr] gap-2">
            <label className="text-[11px] text-[var(--muted)]">
              시간
              <input
                type="text"
                value={draft.time}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, time: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-2 py-2 text-sm outline-none"
              />
            </label>
            <label className="text-[11px] text-[var(--muted)]">
              장소
              <input
                type="text"
                value={draft.location}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, location: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-2 py-2 text-sm outline-none"
              />
            </label>
          </div>
          <label className="block text-[11px] text-[var(--muted)]">
            동선/관계 연출 문구
            <input
              type="text"
              value={draft.contextNote}
              onChange={(e) =>
                setDraft((d) => ({ ...d, contextNote: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm outline-none"
              placeholder="예: 단골 카페인 [달무리 카페]로 이동"
            />
          </label>
          <label className="block text-[11px] text-[var(--muted)]">
            행동 요약
            <textarea
              rows={3}
              value={draft.summary}
              onChange={(e) =>
                setDraft((d) => ({ ...d, summary: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm leading-6 outline-none"
            />
          </label>
          <label className="block text-[11px] text-[var(--muted)]">
            한 줄 속마음 / 리뷰
            <textarea
              rows={2}
              value={draft.innerThought}
              onChange={(e) =>
                setDraft((d) => ({ ...d, innerThought: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm leading-5 outline-none"
            />
          </label>
          <label className="block text-[11px] text-[var(--muted)]">
            상세 보기 (대사·동선)
            <textarea
              rows={8}
              value={draft.detail}
              onChange={(e) =>
                setDraft((d) => ({ ...d, detail: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 font-[family-name:var(--font-display)] text-[13px] leading-7 outline-none"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--line)] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-[11px] text-[var(--muted)]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({
                time: draft.time,
                location: draft.location,
                summary: draft.summary,
                innerThought: draft.innerThought,
                detail: draft.detail,
                contextNote: draft.contextNote.trim() || undefined,
              });
              onClose();
            }}
            className="rounded-lg bg-[var(--ink)] px-3 py-1.5 text-[11px] text-white"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

interface ActionLogCardProps {
  log: ActionLog;
  favoriteCount: number;
  favoriteMax: number;
  onToggleFavorite: (id: string) => void;
  onUpdateLog: (id: string, patch: Partial<ActionLog>) => void;
  onDeleteLog: (id: string) => void;
}

export function ActionLogCard({
  log,
  favoriteCount,
  favoriteMax,
  onToggleFavorite,
  onUpdateLog,
  onDeleteLog,
}: ActionLogCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const canFavorite = log.isFavorite || favoriteCount < favoriteMax;
  const hasCompanions =
    (log.companionNames && log.companionNames.length > 0) || false;

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const handleDelete = () => {
    setMenuOpen(false);
    if (
      window.confirm(
        "이 행동 로그를 삭제하시겠습니까?\n마음에 들지 않거나 캐릭터성에 맞지 않는 기록은 언제든 지울 수 있습니다."
      )
    ) {
      onDeleteLog(log.id);
    }
  };

  return (
    <>
      <article className="border-b border-[var(--line)] px-4 py-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="rounded-md bg-[var(--ink)] px-2 py-0.5 text-[11px] font-medium text-white">
              {log.time}
            </span>
            <span className="rounded-md bg-[var(--wash)] px-2 py-0.5 text-[11px] text-[var(--accent)]">
              [{log.location}]
            </span>
            {log.placeTags?.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] text-[var(--accent)]"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
              aria-label="로그 옵션"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper)] shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setEditOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-[var(--ink)] hover:bg-[var(--wash)]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  수정
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>

        {log.contextNote && (
          <div
            className={`mb-2.5 flex items-start gap-1.5 rounded-lg px-2.5 py-2 text-[11.5px] leading-5 ${
              hasCompanions
                ? "bg-[#f3ebe4] text-[#8a4b28]"
                : "bg-[var(--wash)] text-[var(--muted)]"
            }`}
          >
            {hasCompanions ? (
              <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <MapPinned className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            <span>{log.contextNote}</span>
          </div>
        )}

        <p className="text-[13.5px] leading-6 text-[var(--ink)]">{log.summary}</p>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--wash)] px-3 py-2.5">
          <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
          <p className="text-[12.5px] leading-5 text-[var(--ink)]/80 italic">
            {log.innerThought}
          </p>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--paper)] py-2 text-xs font-medium text-[var(--ink)] transition hover:bg-[var(--wash)]"
          >
            <Search className="h-3.5 w-3.5" />
            상세 보기
          </button>
          <button
            type="button"
            disabled={!canFavorite && !log.isFavorite}
            onClick={() => onToggleFavorite(log.id)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition ${
              log.isFavorite
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--wash)]"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <Star
              className={`h-3.5 w-3.5 ${log.isFavorite ? "fill-current" : ""}`}
            />
            {log.isFavorite ? "즐겨찾기됨" : "즐겨찾기"}
          </button>
        </div>
      </article>
      {detailOpen && (
        <LogDetailModal
          log={log}
          onClose={() => setDetailOpen(false)}
          onSaveDetail={(detail) => onUpdateLog(log.id, { detail })}
        />
      )}
      {editOpen && (
        <LogEditModal
          log={log}
          onClose={() => setEditOpen(false)}
          onSave={(patch) => onUpdateLog(log.id, patch)}
        />
      )}
    </>
  );
}

/** 타임라인 섹션용 안내 툴팁 문구 */
export function TimelineEditHint() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--muted)]">
      관리 가능
      <FieldHint text="마음에 들지 않거나 캐릭터성에 맞지 않는 로그는 언제든 삭제 및 수정할 수 있습니다." />
    </span>
  );
}
