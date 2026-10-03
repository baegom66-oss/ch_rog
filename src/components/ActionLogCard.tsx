"use client";

import {
  Clock3,
  MapPinned,
  MessageCircle,
  MoreHorizontal,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CharacterAvatar from "@/components/CharacterAvatar";
import FieldHint from "@/components/FieldHint";
import Modal from "@/components/Modal";
import { characterTheme } from "@/lib/color";
import { formatMonthDay, toDateKey } from "@/lib/date";
import { toKeywords } from "@/lib/text";
import type { ActionLog, CharacterProfile } from "@/types";

/** 오늘 기록은 시각만, 지난 기록은 날짜까지 */
function logTimeLabel(log: ActionLog) {
  if (!log.date || log.date === toDateKey(new Date())) return log.time;
  return `${formatMonthDay(log.date)} ${log.time}`;
}

interface LogDetailModalProps {
  log: ActionLog;
  /** 로그 주인의 대표 색상 */
  color?: string;
  onClose: () => void;
}

function KeywordChip({ children }: { children: string }) {
  return (
    <span className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10.5px] font-medium leading-4 text-[var(--accent)]">
      {children}
    </span>
  );
}

function LogDetailModal({ log, color, onClose }: LogDetailModalProps) {
  const keywords = toKeywords(log.placeTags);
  return (
    <Modal title="상세 기록" subtitle={`${logTimeLabel(log)} · ${log.location}`} onClose={onClose}>
      <div className="space-y-3 px-4 py-4" style={characterTheme(color)}>
        {(log.contextNote ||
          (log.companionNames && log.companionNames.length > 0) ||
          keywords.length > 0) && (
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
            {keywords.length > 0 && (
              <div className={`flex flex-wrap gap-1 ${log.contextNote ? "mt-2" : ""}`}>
                {keywords.map((keyword) => (
                  <KeywordChip key={keyword}>{keyword}</KeywordChip>
                ))}
              </div>
            )}
          </div>
        )}
        <pre className="whitespace-pre-wrap font-[family-name:var(--font-display)] text-[13px] leading-7 text-[var(--ink)]">
          {log.detail}
        </pre>
      </div>
    </Modal>
  );
}

interface ActionLogCardProps {
  log: ActionLog;
  /** 작성자(로그 주인) 프로필. 삭제된 캐릭터면 undefined */
  character?: CharacterProfile;
  favoriteCount: number;
  favoriteMax: number;
  onToggleFavorite: (id: string) => void;
  onDeleteLog: (id: string) => void;
}

export function ActionLogCard({
  log,
  character,
  favoriteCount,
  favoriteMax,
  onToggleFavorite,
  onDeleteLog,
}: ActionLogCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const canFavorite = log.isFavorite || favoriteCount < favoriteMax;

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
      <article
        className={`feed-card overflow-visible ${log.eventId ? "event-frame" : ""}`}
        style={characterTheme(character?.avatarColor)}
      >
        <div className="flex items-center gap-2.5 px-4 pt-3.5">
          {character ? (
            <CharacterAvatar
              url={character.avatarUrl}
              color={character.avatarColor}
              name={character.name}
              size="sm"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--wash)] text-sm font-semibold text-[var(--muted)]">
              ?
            </div>
          )}
          <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[var(--ink)]">
            {character?.name ?? "알 수 없는 캐릭터"}
          </p>
          <button
            type="button"
            disabled={!canFavorite}
            onClick={() => onToggleFavorite(log.id)}
            className={`shrink-0 rounded-full p-1 text-base leading-none transition hover:bg-[var(--wash)] disabled:cursor-not-allowed disabled:opacity-30 ${
              log.isFavorite ? "" : "opacity-35 grayscale hover:opacity-70"
            }`}
            aria-label={log.isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
            aria-pressed={log.isFavorite}
            title={
              canFavorite
                ? log.isFavorite
                  ? "즐겨찾기 해제"
                  : "즐겨찾기"
                : `보관함이 가득 찼어요 (${favoriteMax}개)`
            }
          >
            <span aria-hidden>⭐</span>
          </button>
          <div className="relative -mr-1.5 shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
              aria-label="로그 옵션"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--card)] shadow-lg">
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

        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 px-4 pt-2.5 text-[12px] text-[var(--muted)]">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock3 className="h-3 w-3" />
            {logTimeLabel(log)}
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPinned className="h-3 w-3 shrink-0" />
            <span className="truncate">{log.location}</span>
          </span>
          {toKeywords(log.placeTags).map((keyword) => (
            <KeywordChip key={keyword}>{keyword}</KeywordChip>
          ))}
        </div>

        <div className="px-4 pb-4 pt-2.5">
          <p className="text-[14px] leading-6 text-[var(--ink)]">
            {log.summary}
          </p>

          <div className="mt-3 flex items-start gap-2 rounded-2xl border-l-[3px] border-[var(--accent)] bg-[var(--paper)] px-3 py-2.5">
            <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
            <p className="text-[12.5px] leading-5 text-[var(--ink)]/80 italic">
              {log.innerThought}
            </p>
          </div>

          <div className="mt-2.5 flex justify-end">
            <button
              type="button"
              onClick={() => setDetailOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted)] transition hover:bg-[var(--wash)] hover:text-[var(--ink)]"
            >
              <Search className="h-3 w-3" />
              상세 보기
            </button>
          </div>
        </div>
      </article>
      {detailOpen && (
        <LogDetailModal
          log={log}
          color={character?.avatarColor}
          onClose={() => setDetailOpen(false)}
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
      <FieldHint text="마음에 들지 않거나 캐릭터성에 맞지 않는 로그는 카드 ⋯ 메뉴에서 언제든 삭제할 수 있습니다." />
    </span>
  );
}
