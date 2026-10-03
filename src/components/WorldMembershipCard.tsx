"use client";

import { Earth } from "lucide-react";
import FieldHint from "@/components/FieldHint";
import {
  isPopulationFull,
  populationOf,
  WORLD_CHARACTER_LIMIT,
  type WorldPopulation,
} from "@/data/worlds";
import type { CharacterProfile, World } from "@/types";

interface WorldMembershipCardProps {
  character: CharacterProfile;
  worlds: World[];
  worldPopulation: WorldPopulation;
  onMove: (worldId: string) => void;
}

/** 캐릭터가 사는 세계와 다른 세계로 이사 */
export default function WorldMembershipCard({
  character,
  worlds,
  worldPopulation,
  onMove,
}: WorldMembershipCardProps) {
  const current = worlds.find((w) => w.id === character.worldId);

  const move = (worldId: string) => {
    const target = worlds.find((w) => w.id === worldId);
    if (!target || worldId === character.worldId || isPopulationFull(worldPopulation, worldId)) {
      return;
    }
    if (
      window.confirm(
        `${character.name}을(를) '${target.name}'(으)로 옮길까요?\n지금 세계의 캐릭터들은 더 이상 서로를 인식하지 못해요. (관계 기록은 보관되어, 다시 돌아오면 복구돼요.)`
      )
    ) {
      onMove(worldId);
    }
  };

  return (
    <section className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3">
      <Earth className="h-4 w-4 shrink-0 text-[var(--accent)]" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
          소속 세계
          <FieldHint text="같은 세계에 사는 캐릭터끼리만 서로를 인식해요. 다른 세계로 옮기면 지금 세계의 캐릭터들과는 존재조차 모르는 사이가 돼요." />
        </p>
        <p className="truncate text-[13px] font-medium text-[var(--ink)]">
          {current ? `${current.emoji} ${current.name}` : "알 수 없는 세계"}
        </p>
      </div>
      {worlds.length > 1 && (
        <select
          value=""
          onChange={(e) => move(e.target.value)}
          className="max-w-[9rem] shrink-0 rounded-lg border border-[var(--line)] bg-[var(--wash)] px-2 py-1.5 text-[11px] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
          aria-label="다른 세계로 이사"
        >
          <option value="" disabled>
            다른 세계로 이사…
          </option>
          {worlds
            .filter((w) => w.id !== character.worldId)
            .map((w) => (
              <option key={w.id} value={w.id} disabled={isPopulationFull(worldPopulation, w.id)}>
                {w.emoji} {w.name} ({populationOf(worldPopulation, w.id)}/{WORLD_CHARACTER_LIMIT})
              </option>
            ))}
        </select>
      )}
    </section>
  );
}
