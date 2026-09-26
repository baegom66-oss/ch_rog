"use client";

import { Compass, MapPin, Plus, Sparkles, X } from "lucide-react";
import { useState } from "react";
import FieldHint from "@/components/FieldHint";
import { MOBILITY_PATTERN_PRESETS } from "@/data/relationshipPresets";
import type { LocationPreferences } from "@/types";

interface LocationPrefsPanelProps {
  prefs: LocationPreferences;
  onChange: (prefs: LocationPreferences) => void;
}

function PlaceChipList({
  places,
  emptyLabel,
  tone,
  editing,
  onRemove,
}: {
  places: string[];
  emptyLabel: string;
  tone: "hangout" | "interest";
  editing: boolean;
  onRemove: (place: string) => void;
}) {
  const chipClass =
    tone === "hangout"
      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
      : "bg-[var(--wash)] text-[var(--muted)] border border-dashed border-[var(--line)]";

  return (
    <div className="flex flex-wrap gap-1.5">
      {places.length === 0 && (
        <span className="text-[11px] text-[var(--muted)]">{emptyLabel}</span>
      )}
      {places.map((place) => (
        <span
          key={place}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${chipClass}`}
        >
          [{place}]
          {editing && (
            <button
              type="button"
              onClick={() => onRemove(place)}
              className="rounded-full p-0.5 hover:bg-black/5"
              aria-label={`${place} 삭제`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

export default function LocationPrefsPanel({
  prefs,
  onChange,
}: LocationPrefsPanelProps) {
  const [editing, setEditing] = useState(false);
  const [hangoutInput, setHangoutInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const addPlace = (kind: "hangouts" | "interested", value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (prefs[kind].includes(trimmed)) return;
    onChange({ ...prefs, [kind]: [...prefs[kind], trimmed] });
  };

  const removePlace = (kind: "hangouts" | "interested", place: string) => {
    onChange({
      ...prefs,
      [kind]: prefs[kind].filter((p) => p !== place),
    });
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" />
          <h2 className="font-[family-name:var(--font-display)] text-sm text-[var(--ink)]">
            자주 가는 장소 · 동선
          </h2>
          <FieldHint text="단골·관심 장소와 동선 성향은 타임라인 이동 로그와 스케줄 생성에 반영됩니다." />
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="rounded-lg bg-[var(--wash)] px-2.5 py-1.5 text-[10px] font-medium text-[var(--ink)] hover:bg-[var(--line)]"
        >
          {editing ? "편집 완료" : "동선 편집"}
        </button>
      </div>

      <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
            <MapPin className="h-3 w-3 text-[var(--accent)]" />
            단골 장소 (아지트)
          </div>
          <PlaceChipList
            places={prefs.hangouts}
            emptyLabel="등록된 단골 장소가 없습니다."
            tone="hangout"
            editing={editing}
            onRemove={(p) => removePlace("hangouts", p)}
          />
          {editing && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={hangoutInput}
                onChange={(e) => setHangoutInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPlace("hangouts", hangoutInput);
                    setHangoutInput("");
                  }
                }}
                placeholder="장소 추가 후 Enter"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
              <button
                type="button"
                onClick={() => {
                  addPlace("hangouts", hangoutInput);
                  setHangoutInput("");
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[var(--wash)] px-3 text-xs hover:bg-[var(--line)]"
              >
                <Plus className="h-3.5 w-3.5" />
                추가
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
            <Sparkles className="h-3 w-3 text-[var(--accent)]" />
            미개척 / 관심 장소
          </div>
          <PlaceChipList
            places={prefs.interested}
            emptyLabel="관심 장소가 없습니다."
            tone="interest"
            editing={editing}
            onRemove={(p) => removePlace("interested", p)}
          />
          {editing && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPlace("interested", interestInput);
                    setInterestInput("");
                  }
                }}
                placeholder="관심 장소 추가"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
              <button
                type="button"
                onClick={() => {
                  addPlace("interested", interestInput);
                  setInterestInput("");
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[var(--wash)] px-3 text-xs hover:bg-[var(--line)]"
              >
                <Plus className="h-3.5 w-3.5" />
                추가
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
            <Compass className="h-3 w-3 text-[var(--accent)]" />
            동선 패턴 성향
          </div>
          {editing ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {MOBILITY_PATTERN_PRESETS.map((pattern) => (
                  <button
                    key={pattern}
                    type="button"
                    onClick={() =>
                      onChange({ ...prefs, mobilityPattern: pattern })
                    }
                    className={`rounded-full px-2.5 py-1 text-[11px] transition ${
                      prefs.mobilityPattern === pattern
                        ? "bg-[var(--ink)] text-white"
                        : "bg-[var(--wash)] text-[var(--muted)] hover:bg-[var(--line)]"
                    }`}
                  >
                    {pattern}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={prefs.mobilityPattern}
                onChange={(e) =>
                  onChange({ ...prefs, mobilityPattern: e.target.value })
                }
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                placeholder="성향 직접 입력"
              />
            </div>
          ) : (
            <span className="inline-flex rounded-full bg-[var(--ink)] px-3 py-1 text-[11px] font-medium text-white">
              {prefs.mobilityPattern || "미설정"}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
