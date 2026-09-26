"use client";

import { Heart, Pencil, Users, X } from "lucide-react";
import { useState } from "react";
import CharacterAvatar from "@/components/CharacterAvatar";
import FieldHint from "@/components/FieldHint";
import { RELATIONSHIP_TAG_PRESETS } from "@/data/relationshipPresets";
import type { CharacterProfile, CharacterRelationship } from "@/types";

interface RelationshipsPanelProps {
  character: CharacterProfile;
  allCharacters: CharacterProfile[];
  onChange: (relationships: CharacterRelationship[]) => void;
}

export default function RelationshipsPanel({
  character,
  allCharacters,
  onChange,
}: RelationshipsPanelProps) {
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CharacterRelationship | null>(null);

  const others = allCharacters.filter((c) => c.id !== character.id);

  const getRel = (targetId: string): CharacterRelationship =>
    character.relationships.find((r) => r.targetId === targetId) ?? {
      targetId,
      tag: "모르는 사이",
      affinity: 0,
      impression: "아직 특별한 인상이 없다.",
    };

  const startEdit = (targetId: string) => {
    setEditingTargetId(targetId);
    setDraft({ ...getRel(targetId) });
  };

  const cancelEdit = () => {
    setEditingTargetId(null);
    setDraft(null);
  };

  const saveEdit = () => {
    if (!draft) return;
    const next = character.relationships.filter(
      (r) => r.targetId !== draft.targetId
    );
    next.push({
      ...draft,
      affinity: Math.max(0, Math.min(100, draft.affinity)),
    });
    onChange(next);
    cancelEdit();
  };

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-[var(--accent)]" />
        <h2 className="font-[family-name:var(--font-display)] text-sm text-[var(--ink)]">
          캐릭터 관계도
        </h2>
        <FieldHint text="상대에 대한 태그와 친밀도는 AI가 동행·대화·SNS 반응을 만들 때 참고합니다." />
      </div>

      <ul className="space-y-3">
        {others.length === 0 && (
          <li className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-6 text-center text-xs text-[var(--muted)]">
            다른 캐릭터가 없으면 관계도를 표시할 수 없습니다.
          </li>
        )}
        {others.map((other) => {
          const rel = getRel(other.id);
          const isEditing = editingTargetId === other.id;

          return (
            <li
              key={other.id}
              className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4"
            >
              <div className="flex items-start gap-3">
                <CharacterAvatar
                  url={other.avatarUrl}
                  emoji={other.avatarEmoji}
                  color={other.avatarColor}
                  name={other.name}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {other.name}
                    </p>
                    <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                      {rel.tag}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--muted)]">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3 text-[var(--accent)]" />
                        친밀도
                      </span>
                      <span className="tabular-nums font-medium text-[var(--ink)]">
                        {rel.affinity}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--wash)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] transition-all"
                        style={{ width: `${rel.affinity}%` }}
                      />
                    </div>
                  </div>
                  {!isEditing && (
                    <p className="mt-2 text-[12.5px] leading-5 text-[var(--ink)]/80 italic">
                      “{rel.impression}”
                    </p>
                  )}
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => startEdit(other.id)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[var(--wash)] px-2 py-1.5 text-[10px] font-medium text-[var(--ink)] hover:bg-[var(--line)]"
                  >
                    <Pencil className="h-3 w-3" />
                    관계 편집
                  </button>
                )}
              </div>

              {isEditing && draft && (
                <div className="mt-3 space-y-2.5 border-t border-[var(--line)] pt-3">
                  <div>
                    <p className="mb-1.5 text-[11px] text-[var(--muted)]">
                      관계 태그
                    </p>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {RELATIONSHIP_TAG_PRESETS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setDraft({ ...draft, tag })}
                          className={`rounded-full px-2.5 py-1 text-[11px] transition ${
                            draft.tag === tag
                              ? "bg-[var(--ink)] text-white"
                              : "bg-[var(--wash)] text-[var(--muted)] hover:bg-[var(--line)]"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={draft.tag}
                      onChange={(e) =>
                        setDraft({ ...draft, tag: e.target.value })
                      }
                      placeholder="직접 입력"
                      className="w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <label className="block text-[11px] text-[var(--muted)]">
                    친밀도 ({draft.affinity})
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={draft.affinity}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          affinity: Number(e.target.value),
                        })
                      }
                      className="mt-1 w-full accent-[var(--accent)]"
                    />
                  </label>
                  <label className="block text-[11px] text-[var(--muted)]">
                    한 줄 속마음 / 인식
                    <textarea
                      rows={2}
                      value={draft.impression}
                      onChange={(e) =>
                        setDraft({ ...draft, impression: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm leading-5 outline-none focus:border-[var(--accent)]"
                      placeholder='예: "같이 있으면 시끄럽지만 심심하진 않다"'
                    />
                  </label>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-[var(--muted)]"
                    >
                      <X className="h-3 w-3" />
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="rounded-lg bg-[var(--ink)] px-3 py-1.5 text-[11px] text-white"
                    >
                      저장
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
