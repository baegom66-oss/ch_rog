"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

interface AddCharacterModalProps {
  onAdd: (name: string) => void;
  onClose: () => void;
}

export default function AddCharacterModal({
  onAdd,
  onClose,
}: AddCharacterModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    onAdd(name.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--ink)]/40 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-t-2xl bg-[var(--paper)] shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-char-title"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <div>
            <p
              id="add-char-title"
              className="text-sm font-semibold text-[var(--ink)]"
            >
              캐릭터 추가
            </p>
            <p className="text-[11px] text-[var(--muted)]">
              이름은 나중에 프로필에서 자세히 편집할 수 있어요
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
                if (e.key === "Enter") submit();
              }}
              placeholder="예: 하린"
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
            />
          </label>
          {error && <p className="text-[11px] text-red-600">{error}</p>}
          <button
            type="button"
            onClick={submit}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--ink)] py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            추가하기
          </button>
        </div>
      </div>
    </div>
  );
}
