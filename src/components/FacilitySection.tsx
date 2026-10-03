"use client";

import { MapPin, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { Facility, FacilityType } from "@/types";

interface FacilitySectionProps {
  /** 이 세계의 시설만 */
  facilities: Facility[];
  onAdd: (facility: Omit<Facility, "id" | "worldId">) => void;
  onUpdate: (id: string, patch: Partial<Facility>) => void;
}

export const FACILITY_TYPES: FacilityType[] = ["건물", "도시", "해외", "기타"];

/** 세계 안에 존재하는 장소 목록 */
export default function FacilitySection({
  facilities,
  onAdd,
  onUpdate,
}: FacilitySectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    type: "건물" as FacilityType,
    description: "",
    unlocked: true,
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "건물" as FacilityType,
    description: "",
    unlocked: true,
  });

  const startEdit = (f: Facility) => {
    setEditingId(f.id);
    setDraft({
      name: f.name,
      type: f.type,
      description: f.description,
      unlocked: f.unlocked,
    });
  };

  const saveEdit = () => {
    if (!editingId || !draft.name.trim() || !draft.description.trim()) return;
    onUpdate(editingId, draft);
    setEditingId(null);
  };

  const submitAdd = () => {
    if (!form.name.trim() || !form.description.trim()) return;
    onAdd(form);
    setForm({
      name: "",
      type: "건물",
      description: "",
      unlocked: true,
    });
    setShowForm(false);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-1.5 font-[family-name:var(--font-display)] text-sm text-[var(--ink)]">
            <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" />
            이 세계의 시설
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">
            이 세계에만 존재하는 장소예요. 캐릭터들은 여기 있는 곳으로만 다녀요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[var(--accent)] px-3 py-2 text-[11px] font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          장소 추가
        </button>
      </div>

      {showForm && (
        <div className="space-y-2 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <p className="text-xs font-semibold text-[var(--ink)]">새 장소 등록</p>
          <input
            type="text"
            placeholder="장소 이름"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <select
            value={form.type}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                type: e.target.value as FacilityType,
              }))
            }
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          >
            {FACILITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <textarea
            rows={3}
            placeholder="상세 설명"
            value={form.description}
            onChange={(e) =>
              setForm((s) => ({ ...s, description: e.target.value }))
            }
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm leading-6 outline-none focus:border-[var(--accent)]"
          />
          <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <input
              type="checkbox"
              checked={form.unlocked}
              onChange={(e) =>
                setForm((s) => ({ ...s, unlocked: e.target.checked }))
              }
              className="accent-[var(--accent)]"
            />
            바로 해금
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-[11px] text-[var(--muted)]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={submitAdd}
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[11px] text-white"
            >
              등록
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {facilities.length === 0 && (
          <li className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-xs text-[var(--muted)]">
            아직 등록된 장소가 없어요. 세계관에 어울리는 장소를 추가해 보세요.
          </li>
        )}
        {facilities.map((f) => (
          <li
            key={f.id}
            className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4"
          >
            {editingId === f.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm outline-none"
                />
                <select
                  value={draft.type}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      type: e.target.value as FacilityType,
                    }))
                  }
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm outline-none"
                >
                  {FACILITY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <textarea
                  rows={3}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, description: e.target.value }))
                  }
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm leading-6 outline-none"
                />
                <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <input
                    type="checkbox"
                    checked={draft.unlocked}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, unlocked: e.target.checked }))
                    }
                    className="accent-[var(--accent)]"
                  />
                  해금됨
                </label>
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
                    className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[11px] text-white"
                  >
                    저장
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" />
                      <h3 className="text-sm font-semibold text-[var(--ink)]">
                        {f.name}
                      </h3>
                      <span className="rounded-md bg-[var(--wash)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
                        {f.type}
                      </span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                          f.unlocked
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {f.unlocked ? "해금" : "잠김"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(f)}
                    className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
                    aria-label="수정"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[12.5px] leading-6 text-[var(--ink)]/85">
                  {f.description}
                </p>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
