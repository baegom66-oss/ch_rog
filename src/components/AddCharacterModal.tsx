"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import Modal from "@/components/Modal";
import {
  isPopulationFull,
  populationOf,
  TOTAL_CHARACTER_LIMIT,
  totalPopulation,
  WORLD_CHARACTER_LIMIT,
  type WorldPopulation,
} from "@/data/worlds";
import { isSubmitEnter } from "@/lib/keyboard";
import type { World } from "@/types";

interface AddCharacterModalProps {
  worlds: World[];
  worldPopulation: WorldPopulation;
  defaultWorldId: string;
  onAdd: (name: string, worldId: string) => void;
  onClose: () => void;
}

const fieldClass =
  "mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]";

export default function AddCharacterModal({
  worlds,
  worldPopulation,
  defaultWorldId,
  onAdd,
  onClose,
}: AddCharacterModalProps) {
  const isFull = (id: string) => isPopulationFull(worldPopulation, id);
  const totalCount = totalPopulation(worldPopulation);
  const totalFull = totalCount >= TOTAL_CHARACTER_LIMIT;
  const [name, setName] = useState("");
  const [worldId, setWorldId] = useState(() =>
    isFull(defaultWorldId)
      ? (worlds.find((w) => !isFull(w.id))?.id ?? defaultWorldId)
      : defaultWorldId
  );
  const [error, setError] = useState("");

  const submit = () => {
    if (totalFull) return;
    if (!name.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    if (isFull(worldId)) {
      setError(`이 세계는 이미 ${WORLD_CHARACTER_LIMIT}명이 살고 있어요.`);
      return;
    }
    onAdd(name.trim(), worldId);
    onClose();
  };

  return (
    <Modal
      title="캐릭터 추가"
      subtitle={
        <>
          이름은 나중에 프로필에서 자세히 편집할 수 있어요 · 전체{" "}
          <span className="tabular-nums">
            {totalCount}/{TOTAL_CHARACTER_LIMIT}
          </span>
          명
        </>
      }
      onClose={onClose}
    >
      <div className="space-y-3 px-4 py-4">
        <label className="block text-[11px] text-[var(--muted)]">
          이름 <span className="text-[var(--accent)]">*</span>
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value.trim()) setError("");
            }}
            onKeyDown={(e) => {
              if (isSubmitEnter(e)) submit();
            }}
            placeholder="예: 하린"
            className={fieldClass}
          />
        </label>
        <label className="block text-[11px] text-[var(--muted)]">
          살게 될 세계
          <select
            value={worldId}
            onChange={(e) => {
              setWorldId(e.target.value);
              setError("");
            }}
            className={fieldClass}
          >
            {worlds.map((w) => (
              <option key={w.id} value={w.id} disabled={isFull(w.id)}>
                {w.emoji} {w.name} ({populationOf(worldPopulation, w.id)}/{WORLD_CHARACTER_LIMIT}
                {isFull(w.id) ? " · 가득 참" : ""})
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[10.5px]">
            같은 세계의 캐릭터끼리만 서로를 알아요.
          </span>
        </label>
        {totalFull && (
          <p className="rounded-xl bg-[var(--wash)] px-3 py-2 text-[11px] text-[var(--ink)]">
            모든 세계를 합쳐 최대 {TOTAL_CHARACTER_LIMIT}명까지 만들 수 있어요. 지금은 더 추가할 수 없어요.
          </p>
        )}
        {error && <p className="text-[11px] text-red-600">{error}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={totalFull}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-medium text-white disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          추가하기
        </button>
      </div>
    </Modal>
  );
}
