"use client";

import { MapPinned, Star, Users } from "lucide-react";
import CharacterAvatar from "@/components/CharacterAvatar";
import Modal from "@/components/Modal";
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

  return (
    <Modal
      title="보관함"
      subtitle={`즐겨찾기한 행동 로그 ${favorites.length}/${favoriteMax}`}
      onClose={onClose}
    >
      {favorites.length === 0 ? (
        <div className="px-4 py-12 text-center text-xs text-[var(--muted)]">
          아직 보관한 로그가 없습니다.
          <br />
          타임라인에서 ⭐ 즐겨찾기를 눌러 저장해 보세요.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {favorites.map((log) => {
            const owner = characters.find((c) => c.id === log.characterId);
            return (
              <li key={log.id} className="px-4 py-3.5">
                <div className="mb-2 flex items-center gap-2">
                  {owner && (
                    <CharacterAvatar
                      url={owner.avatarUrl}
                      color={owner.avatarColor}
                      name={owner.name}
                      size="sm"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--ink)]">
                      {owner?.name ?? "알 수 없음"}
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
    </Modal>
  );
}
