"use client";

import { MapPinned, Star, Users, X } from "lucide-react";
import CharacterAvatar from "@/components/CharacterAvatar";
import type { ActionLog, CharacterProfile } from "@/types";

interface FavoritesVaultProps {
  logs: ActionLog[];
  characters: CharacterProfile[];
  favoriteMax: number;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
}

export default function FavoritesVault({
  logs,
  characters,
  favoriteMax,
  onToggleFavorite,
  onClose,
}: FavoritesVaultProps) {
  const favorites = logs.filter((l) => l.isFavorite);

  const charName = (id: string) =>
    characters.find((c) => c.id === id)?.name ?? "알 수 없음";

  const char = (id: string) => characters.find((c) => c.id === id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--ink)]/40 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-[var(--paper)] shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-title"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <div>
            <p
              id="vault-title"
              className="text-sm font-semibold text-[var(--ink)]"
            >
              보관함
            </p>
            <p className="text-[11px] text-[var(--muted)]">
              즐겨찾기한 행동 로그 {favorites.length}/{favoriteMax}
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

        <div className="flex-1 overflow-y-auto">
          {favorites.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-[var(--muted)]">
              아직 보관한 로그가 없습니다.
              <br />
              타임라인에서 ⭐ 즐겨찾기를 눌러 저장해 보세요.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {favorites.map((log) => {
                const owner = char(log.characterId);
                return (
                  <li key={log.id} className="px-4 py-3.5">
                    <div className="mb-2 flex items-center gap-2">
                      {owner && (
                        <CharacterAvatar
                          url={owner.avatarUrl}
                          emoji={owner.avatarEmoji}
                          color={owner.avatarColor}
                          name={owner.name}
                          size="sm"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[var(--ink)]">
                          {charName(log.characterId)}
                        </p>
                        <p className="text-[10px] text-[var(--muted)]">
                          {log.time} · [{log.location}]
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(log.id)}
                        className="rounded-lg bg-[var(--accent-soft)] p-1.5 text-[var(--accent)]"
                        aria-label="즐겨찾기 해제"
                        title="보관 해제"
                      >
                        <Star className="h-3.5 w-3.5 fill-current" />
                      </button>
                    </div>
                    {log.contextNote && (
                      <p className="mb-1.5 flex items-start gap-1 text-[11px] text-[var(--muted)]">
                        {log.companionNames?.length ? (
                          <Users className="mt-0.5 h-3 w-3 shrink-0" />
                        ) : (
                          <MapPinned className="mt-0.5 h-3 w-3 shrink-0" />
                        )}
                        {log.contextNote}
                      </p>
                    )}
                    <p className="text-[13px] leading-5 text-[var(--ink)]">
                      {log.summary}
                    </p>
                    <p className="mt-1.5 text-[12px] italic text-[var(--ink)]/70">
                      “{log.innerThought}”
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
