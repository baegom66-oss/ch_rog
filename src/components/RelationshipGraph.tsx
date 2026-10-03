"use client";

import { ArrowRight, Heart, Network, Pencil, X } from "lucide-react";
import { useState } from "react";
import CharacterAvatar from "@/components/CharacterAvatar";
import FieldHint from "@/components/FieldHint";
import {
  findRelationship,
  getRelationshipType,
  RELATIONSHIP_TYPES,
} from "@/data/relationships";
import type { CharacterProfile, CharacterRelationship } from "@/types";

interface RelationshipGraphProps {
  /** 가운데에 놓이는 캐릭터 (캐릭터 탭에서 선택한 캐릭터) */
  focus: CharacterProfile;
  characters: CharacterProfile[];
  onSave: (rel: CharacterRelationship) => void;
}

/** 가장 가까운 거리. 가운데 프로필과 겹치지 않을 만큼 띄운다 */
const MIN_RADIUS = 27;
/** 가장 먼 거리 (모르는 사이·친밀도 0) */
const MAX_RADIUS = 40;
/** 거미줄 링이 나타내는 친밀도 눈금 */
const RING_AFFINITIES = [100, 66, 33, 0];

/** 두 캐릭터가 서로에게 느끼는 친밀도의 평균. 모르는 사이면 0 */
function closeness(a: CharacterProfile, b: CharacterProfile) {
  if (pairType(a, b) === "stranger") return 0;
  return (findRelationship(a, b.id).affinity + findRelationship(b, a.id).affinity) / 2;
}

function radiusFor(affinity: number) {
  return MAX_RADIUS - (affinity / 100) * (MAX_RADIUS - MIN_RADIUS);
}

const WEB_RINGS = RING_AFFINITIES.map(radiusFor);

interface NodePosition {
  character: CharacterProfile;
  x: number;
  y: number;
}

/** 가운데는 focus, 나머지는 친밀도가 높을수록 가운데에 가깝게 */
function layoutNodes(
  focus: CharacterProfile,
  others: CharacterProfile[]
): NodePosition[] {
  return [
    { character: focus, x: 50, y: 50 },
    ...others.map((character, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / others.length;
      const radius = radiusFor(closeness(focus, character));
      return {
        character,
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
      };
    }),
  ];
}

/** 두 캐릭터 사이 관계 분류 (한쪽만 기록돼 있으면 그쪽 값) */
function pairType(a: CharacterProfile, b: CharacterProfile) {
  const ab = findRelationship(a, b.id).type;
  return ab !== "stranger" ? ab : findRelationship(b, a.id).type;
}

function TypeBadge({ rel }: { rel: CharacterRelationship }) {
  const meta = getRelationshipType(rel.type);
  const color = meta.color ?? "var(--muted)";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      {meta.label}
      {rel.tag && rel.tag !== meta.label && (
        <span className="font-medium opacity-80">· {rel.tag}</span>
      )}
    </span>
  );
}

function AffinityRow({
  from,
  to,
  rel,
}: {
  from: CharacterProfile;
  to: CharacterProfile;
  rel: CharacterRelationship;
}) {
  const color = getRelationshipType(rel.type).color ?? "var(--muted)";
  return (
    <div className="rounded-xl bg-[var(--paper)] px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <span className="inline-flex items-center gap-1 font-medium text-[var(--ink)]">
          {from.name}
          <ArrowRight className="h-3 w-3 text-[var(--muted)]" />
          {to.name}
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums text-[var(--muted)]">
          <Heart className="h-3 w-3" style={{ color }} />
          친밀도 <b className="text-[var(--ink)]">{rel.affinity}</b>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--wash)]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${rel.affinity}%`, backgroundColor: color }}
        />
      </div>
      <p className="mt-2 text-[12.5px] leading-5 text-[var(--ink)]/80 italic">
        {rel.impression ? `“${rel.impression}”` : "아직 특별한 인상이 없다."}
      </p>
    </div>
  );
}

function RelationshipEditor({
  focus,
  other,
  initial,
  onCancel,
  onSave,
}: {
  focus: CharacterProfile;
  other: CharacterProfile;
  initial: CharacterRelationship;
  onCancel: () => void;
  onSave: (rel: CharacterRelationship) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const presets = getRelationshipType(draft.type).tagPresets;

  const changeType = (type: CharacterRelationship["type"]) => {
    const wasPreset = getRelationshipType(draft.type).tagPresets.includes(draft.tag);
    setDraft({
      ...draft,
      type,
      tag: wasPreset || !draft.tag ? getRelationshipType(type).tagPresets[0] : draft.tag,
    });
  };

  const inputClass =
    "mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm leading-5 text-[var(--ink)] outline-none focus:border-[var(--accent)]";

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-[11px] text-[var(--muted)]">관계 분류</p>
        <div className="flex flex-wrap gap-1.5">
          {RELATIONSHIP_TYPES.map((t) => {
            const active = draft.type === t.type;
            return (
              <button
                key={t.type}
                type="button"
                onClick={() => changeType(t.type)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--wash)]"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: t.color ?? "transparent",
                    border: t.color ? undefined : "1px dashed currentColor",
                  }}
                />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block text-[11px] text-[var(--muted)]">
        세부 호칭 ({focus.name} 기준)
        <div className="mt-1 flex flex-wrap gap-1">
          {presets.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setDraft({ ...draft, tag })}
              className={`rounded-full px-2 py-0.5 text-[10.5px] transition ${
                draft.tag === tag
                  ? "bg-[var(--accent)] text-white"
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
          onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
          placeholder="직접 입력 (예: 동생, 단골 손님)"
          className={inputClass}
        />
      </label>

      <label className="block text-[11px] text-[var(--muted)]">
        관계 설명
        <textarea
          rows={3}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="어떻게 알게 됐는지, 지금은 어떤 사이인지"
          className={inputClass}
        />
      </label>

      <label className="block text-[11px] text-[var(--muted)]">
        {focus.name} → {other.name} 친밀도 ({draft.affinity})
        <input
          type="range"
          min={0}
          max={100}
          value={draft.affinity}
          onChange={(e) => setDraft({ ...draft, affinity: Number(e.target.value) })}
          className="mt-1 w-full accent-[var(--accent)]"
        />
      </label>

      <label className="block text-[11px] text-[var(--muted)]">
        {focus.name}의 속마음
        <textarea
          rows={2}
          value={draft.impression}
          onChange={(e) => setDraft({ ...draft, impression: e.target.value })}
          placeholder='예: "같이 있으면 시끄럽지만 심심하진 않다"'
          className={inputClass}
        />
      </label>

      <p className="text-[10.5px] text-[var(--muted)]">
        관계 분류와 설명은 {other.name}의 관계도에도 함께 반영돼요. 친밀도·속마음은{" "}
        {focus.name}의 시점이에요.
      </p>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-[11px] text-[var(--muted)]"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => onSave({ ...draft, tag: draft.tag.trim() })}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[11px] text-white"
        >
          저장
        </button>
      </div>
    </div>
  );
}

export default function RelationshipGraph({
  focus,
  characters,
  onSave,
}: RelationshipGraphProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const others = characters.filter((c) => c.id !== focus.id);
  const nodes = layoutNodes(focus, others);
  const active = others.find((c) => c.id === activeId);

  const edges = nodes.flatMap((a, i) =>
    nodes.slice(i + 1).flatMap((b) => {
      const color = getRelationshipType(pairType(a.character, b.character)).color;
      if (!color) return [];
      const affinity = closeness(a.character, b.character);
      const touchesFocus = a.character.id === focus.id || b.character.id === focus.id;
      const highlighted = active
        ? [a.character.id, b.character.id].includes(active.id) && touchesFocus
        : touchesFocus;
      return [{ a, b, color, width: 1.5 + (affinity / 100) * 3, highlighted }];
    })
  );

  const selectNode = (id: string) => {
    setEditing(false);
    setActiveId(id === focus.id || id === activeId ? null : id);
  };

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Network className="h-3.5 w-3.5 text-[var(--accent)]" />
        <h2 className="font-[family-name:var(--font-display)] text-sm text-[var(--ink)]">
          캐릭터 관계도
        </h2>
        <FieldHint text="서로의 친밀도가 높을수록 가운데 프로필에 가깝게 놓이고, 모르는 사이는 가장 바깥에 있어요. 관계 분류와 친밀도는 AI가 동행·대화·SNS 반응을 만들 때 참고합니다. 프로필을 누르면 자세한 관계를 볼 수 있어요." />
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
        {others.length === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--muted)]">
            다른 캐릭터를 추가하면 관계도가 그려집니다.
          </p>
        ) : (
          <>
            <div className="relative mx-auto aspect-square w-full max-w-[340px]">
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full"
                aria-hidden
              >
                {WEB_RINGS.map((r) => (
                  <circle
                    key={r}
                    cx={50}
                    cy={50}
                    r={r}
                    fill="none"
                    stroke="var(--line)"
                    strokeDasharray="1.2 1.6"
                    strokeWidth={0.35}
                  />
                ))}
                {nodes.slice(1).map((n) => (
                  <line
                    key={`spoke-${n.character.id}`}
                    x1={50}
                    y1={50}
                    x2={n.x}
                    y2={n.y}
                    stroke="var(--line)"
                    strokeWidth={0.3}
                  />
                ))}
                {edges.map(({ a, b, color, width, highlighted }) => (
                  <line
                    key={`${a.character.id}-${b.character.id}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={color}
                    strokeWidth={width}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    opacity={highlighted ? 0.95 : 0.3}
                    className="transition-opacity"
                  />
                ))}
              </svg>

              {nodes.map(({ character, x, y }) => {
                const isFocus = character.id === focus.id;
                const rel = isFocus ? null : findRelationship(focus, character.id);
                const ring = rel ? getRelationshipType(rel.type).color : null;
                const selected = character.id === activeId;
                return (
                  <button
                    key={character.id}
                    type="button"
                    onClick={() => selectNode(character.id)}
                    className="absolute flex w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    aria-label={`${character.name} 관계 보기`}
                    aria-pressed={selected}
                  >
                    <span
                      className={`rounded-full bg-[var(--paper)] p-[3px] transition ${
                        selected ? "scale-110 shadow-lg" : "hover:scale-105"
                      }`}
                      style={{
                        border: `2.5px ${ring || isFocus ? "solid" : "dashed"} ${
                          isFocus ? "var(--ink)" : (ring ?? "var(--line)")
                        }`,
                      }}
                    >
                      <CharacterAvatar
                        url={character.avatarUrl}
                        color={character.avatarColor}
                        name={character.name}
                        size={isFocus ? "md" : "sm"}
                        className="shadow-none! ring-0!"
                      />
                    </span>
                    <span className="max-w-full truncate rounded-full bg-[var(--paper)]/90 px-1.5 text-[11px] font-semibold text-[var(--ink)]">
                      {character.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <ul className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10.5px] text-[var(--muted)]">
              {RELATIONSHIP_TYPES.map((t) => (
                <li key={t.type} className="inline-flex items-center gap-1">
                  {t.color ? (
                    <span className="h-[3px] w-4 rounded-full" style={{ backgroundColor: t.color }} />
                  ) : (
                    <span className="w-4 border-t border-dashed border-[var(--muted)]" />
                  )}
                  {t.label}
                  {!t.color && " (선 없음)"}
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-center text-[10px] text-[var(--muted)]">
              가운데에 가까울수록 서로 친밀한 사이예요
            </p>
          </>
        )}
      </div>

      {active ? (
        <div className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--ink)]">
                {focus.name} · {active.name}
              </p>
              <div className="mt-1">
                <TypeBadge rel={findRelationship(focus, active.id)} />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--wash)] px-2 py-1.5 text-[10px] font-medium text-[var(--ink)] hover:bg-[var(--line)]"
                >
                  <Pencil className="h-3 w-3" />
                  관계 편집
                </button>
              )}
              <button
                type="button"
                onClick={() => selectNode(active.id)}
                className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--wash)]"
                aria-label="닫기"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {editing ? (
            <RelationshipEditor
              key={active.id}
              focus={focus}
              other={active}
              initial={findRelationship(focus, active.id)}
              onCancel={() => setEditing(false)}
              onSave={(rel) => {
                onSave(rel);
                setEditing(false);
              }}
            />
          ) : (
            <div className="space-y-2.5">
              <div>
                <p className="mb-1 text-[11px] text-[var(--muted)]">관계 설명</p>
                <p className="text-[13px] leading-6 text-[var(--ink)]">
                  {findRelationship(focus, active.id).description || (
                    <span className="text-[var(--muted)]">아직 관계 설명이 없어요.</span>
                  )}
                </p>
              </div>
              <AffinityRow from={focus} to={active} rel={findRelationship(focus, active.id)} />
              <AffinityRow from={active} to={focus} rel={findRelationship(active, focus.id)} />
            </div>
          )}
        </div>
      ) : (
        others.length > 0 && (
          <ul className="mt-3 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--card)]">
            {others.map((other) => {
              const rel = findRelationship(focus, other.id);
              return (
                <li key={other.id}>
                  <button
                    type="button"
                    onClick={() => selectNode(other.id)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--wash)]"
                  >
                    <CharacterAvatar
                      url={other.avatarUrl}
                      color={other.avatarColor}
                      name={other.name}
                      size="xs"
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--ink)]">
                      {other.name}
                    </span>
                    <TypeBadge rel={rel} />
                    <span className="w-8 text-right text-[11px] tabular-nums text-[var(--muted)]">
                      {rel.affinity}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )
      )}
    </section>
  );
}
