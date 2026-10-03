"use client";

import {
  Check,
  Clock3,
  Earth,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import CharacterAvatar from "@/components/CharacterAvatar";
import FacilitySection from "@/components/FacilitySection";
import FieldHint from "@/components/FieldHint";
import { inputClass } from "@/components/ProfileFields";
import {
  OfflineFrequencyOptions,
  SpeedSelector,
} from "@/components/TimelineSettingsFields";
import {
  charactersInWorld,
  DEFAULT_WORLD_LORE,
  isTotalCharacterFull,
  TOTAL_CHARACTER_LIMIT,
  WORLD_CHARACTER_LIMIT,
  WORLD_EMOJIS,
  WORLD_LIMIT,
} from "@/data/worlds";
import { formatMonthDay } from "@/lib/date";
import { isSubmitEnter } from "@/lib/keyboard";
import type {
  CharacterProfile,
  Facility,
  World,
  WorldTimelineSettings,
} from "@/types";

interface WorldTabProps {
  worlds: World[];
  currentWorld: World;
  characters: CharacterProfile[];
  facilities: Facility[];
  onSelectWorld: (id: string) => void;
  onAddWorld: (name: string) => void;
  onUpdateWorld: (id: string, patch: Partial<World>) => void;
  onDeleteWorld: (id: string) => void;
  onApplyTimelineToAll: (timeline: WorldTimelineSettings) => void;
  onOpenAddCharacter: () => void;
  onOpenCharacter: (id: string) => void;
  onFulfillWish: (characterId: string, wishId: string) => void;
  onAddFacility: (facility: Omit<Facility, "id">) => void;
  onUpdateFacility: (id: string, patch: Partial<Facility>) => void;
}

function WorldInfoCard({
  world,
  onSave,
}: {
  world: World;
  onSave: (patch: Partial<World>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: world.name, emoji: world.emoji, lore: world.lore });

  const save = () => {
    if (!draft.name.trim()) return;
    onSave({ name: draft.name.trim(), emoji: draft.emoji, lore: draft.lore.trim() });
    setEditing(false);
  };

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        {editing ? (
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap gap-1">
              {WORLD_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, emoji: e }))}
                  className={`h-8 w-8 rounded-lg text-base transition ${
                    draft.emoji === e ? "bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]" : "bg-[var(--wash)] hover:bg-[var(--line)]"
                  }`}
                  aria-label={`아이콘 ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="세계 이름"
              className={inputClass}
            />
          </div>
        ) : (
          <h2 className="flex min-w-0 items-center gap-2 font-[family-name:var(--font-display)] text-base text-[var(--ink)]">
            <span className="text-xl">{world.emoji}</span>
            <span className="truncate">{world.name}</span>
          </h2>
        )}
        {editing ? (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-2 py-1.5 text-[11px] text-[var(--muted)]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!draft.name.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent)] px-2.5 py-1.5 text-[11px] text-white disabled:opacity-40"
            >
              <Save className="h-3 w-3" />
              저장
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft({ name: world.name, emoji: world.emoji, lore: world.lore });
              setEditing(true);
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[var(--wash)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--ink)] hover:bg-[var(--line)]"
          >
            <Pencil className="h-3 w-3" />
            세계 편집
          </button>
        )}
      </div>

      <div className="mb-1 flex items-center gap-1">
        <span className="text-[11px] text-[var(--muted)]">세계관</span>
        <FieldHint text="이 세계가 어떤 곳인지 적어 주세요. 타임라인과 SNS 글은 이 세계관을 참고해서 만들어져요. 비워 두면 현대 일상을 기준으로 해요." />
        {!world.lore.trim() && !editing && (
          <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
            기본 · 현대 일상
          </span>
        )}
      </div>
      {editing ? (
        <textarea
          rows={5}
          value={draft.lore}
          onChange={(e) => setDraft((d) => ({ ...d, lore: e.target.value }))}
          placeholder={`비워 두면 이렇게 만들어져요:\n${DEFAULT_WORLD_LORE}`}
          className={inputClass}
        />
      ) : (
        <p
          className={`rounded-xl bg-[var(--wash)]/70 px-3 py-2.5 text-[13px] leading-6 whitespace-pre-wrap ${
            world.lore.trim() ? "text-[var(--ink)]" : "text-[var(--ink)]/70"
          }`}
        >
          {world.lore.trim() || DEFAULT_WORLD_LORE}
        </p>
      )}
    </section>
  );
}

function KeptWishesCard({
  residents,
  onOpen,
  onFulfill,
}: {
  residents: CharacterProfile[];
  onOpen: (id: string) => void;
  onFulfill: (characterId: string, wishId: string) => void;
}) {
  const [fulfilled, setFulfilled] = useState("");
  const entries = residents.flatMap((c) =>
    c.wishes.filter((w) => w.kept).map((wish) => ({ character: c, wish }))
  );
  if (entries.length === 0 && !fulfilled) return null;

  return (
    <section className="rounded-2xl border border-dashed border-[var(--accent)]/40 bg-[var(--accent-soft)]/50 p-4">
      <h3 className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink)]">
        <Sparkles className="h-4 w-4 text-[var(--accent)]" />
        간직 중인 소원
        <span className="text-[11px] tabular-nums text-[var(--muted)]">{entries.length}</span>
        <FieldHint text="이 세계 캐릭터들이 '이룰 때까지 간직하기'로 체크해 둔 소원이에요. 소원에 어울리는 장소를 아래 시설에 추가해 볼 수도 있어요." />
      </h3>
      <p className="mb-3 text-[11px] text-[var(--muted)]">
        이뤄 주면 캐릭터 프로필의 소원에서도 사라져요.
      </p>
      {fulfilled && (
        <p className="mb-2 rounded-lg bg-[var(--card)] px-2.5 py-1.5 text-[11px] text-[var(--accent)]">
          ✨ 소원을 이뤘어요 · {fulfilled}
        </p>
      )}
      <ul className="space-y-2">
        {entries.map(({ character, wish }) => (
          <li key={wish.id} className="flex gap-2.5 rounded-xl bg-[var(--card)]/80 px-3 py-2.5">
            <button
              type="button"
              onClick={() => onOpen(character.id)}
              className="shrink-0"
              aria-label={`${character.name} 프로필 보기`}
            >
              <CharacterAvatar
                url={character.avatarUrl}
                color={character.avatarColor}
                name={character.name}
                size="xs"
              />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] text-[var(--muted)]">
                <button
                  type="button"
                  onClick={() => onOpen(character.id)}
                  className="font-semibold text-[var(--ink)] hover:text-[var(--accent)]"
                >
                  {character.name}
                </button>
                {wish.date ? ` · ${formatMonthDay(wish.date)}부터` : ""}
              </p>
              <p className="mt-0.5 text-[12.5px] leading-5 text-[var(--ink)] whitespace-pre-wrap">
                {wish.text}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onFulfill(character.id, wish.id);
                setFulfilled(`${character.name} · ${wish.text}`);
                window.setTimeout(() => setFulfilled(""), 2500);
              }}
              className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg bg-[var(--accent)] px-2 py-1 text-[10.5px] font-medium text-white"
            >
              <Check className="h-3 w-3" />
              이뤄졌어요
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResidentsCard({
  residents,
  totalFull,
  onAdd,
  onOpen,
}: {
  residents: CharacterProfile[];
  totalFull: boolean;
  onAdd: () => void;
  onOpen: (id: string) => void;
}) {
  const full = residents.length >= WORLD_CHARACTER_LIMIT;
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink)]">
          <Users className="h-4 w-4 text-[var(--accent)]" />
          사는 캐릭터
          <span className={`text-[11px] tabular-nums ${full ? "text-red-600" : "text-[var(--muted)]"}`}>
            {residents.length}/{WORLD_CHARACTER_LIMIT}
          </span>
          <FieldHint text="같은 세계에 사는 캐릭터끼리만 서로를 인식해요. 세계가 다르면 모르는 사이도 아니고, 존재 자체를 몰라요." />
        </h3>
        <button
          type="button"
          onClick={onAdd}
          disabled={full || totalFull}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--wash)] px-3 py-1.5 text-[11px] font-medium text-[var(--ink)] hover:bg-[var(--line)] disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          캐릭터 추가
        </button>
      </div>
      {residents.length === 0 ? (
        <p className="py-4 text-center text-xs text-[var(--muted)]">
          아직 이 세계에 사는 캐릭터가 없어요.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {residents.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onOpen(c.id)}
              className="flex w-14 flex-col items-center gap-1"
            >
              <CharacterAvatar
                url={c.avatarUrl}
                color={c.avatarColor}
                name={c.name}
                size="sm"
              />
              <span className="w-full truncate text-center text-[11px] text-[var(--ink)]">
                {c.name}
              </span>
            </button>
          ))}
        </div>
      )}
      {full ? (
        <p className="mt-3 text-[10.5px] text-[var(--muted)]">
          한 세계에는 최대 {WORLD_CHARACTER_LIMIT}명까지 살 수 있어요.
        </p>
      ) : (
        totalFull && (
          <p className="mt-3 text-[10.5px] text-[var(--muted)]">
            모든 세계를 합쳐 최대 {TOTAL_CHARACTER_LIMIT}명까지 만들 수 있어요.
          </p>
        )
      )}
    </section>
  );
}

function TimelineSettingsCard({
  world,
  worldCount,
  onChange,
  onApplyToAll,
}: {
  world: World;
  worldCount: number;
  onChange: (patch: Partial<WorldTimelineSettings>) => void;
  onApplyToAll: () => void;
}) {
  const [applied, setApplied] = useState(false);
  return (
    <section className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <div>
        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink)]">
          <Clock3 className="h-4 w-4 text-[var(--accent)]" />
          이 세계의 타임라인 설정
        </h3>
        <p className="mt-0.5 text-[11px] text-[var(--muted)]">
          이 세계에만 적용돼요. 다른 세계는 각자의 시간으로 흘러가요.
        </p>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] text-[var(--muted)]">시뮬레이션 배속</p>
        <SpeedSelector value={world.timeline.speed} onChange={(speed) => onChange({ speed })} />
      </div>
      <div>
        <p className="mb-1.5 text-[11px] text-[var(--muted)]">오프라인 타임라인 생성</p>
        <OfflineFrequencyOptions
          name={`offline-${world.id}`}
          value={world.timeline.offlineFrequency}
          onChange={(offlineFrequency) => onChange({ offlineFrequency })}
        />
      </div>
      {worldCount > 1 && (
        <button
          type="button"
          onClick={() => {
            onApplyToAll();
            setApplied(true);
            window.setTimeout(() => setApplied(false), 1800);
          }}
          className="w-full rounded-xl border border-dashed border-[var(--accent)]/50 py-2 text-[11.5px] font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)]/50"
        >
          {applied ? "모든 세계에 적용했어요" : `이 설정을 모든 세계(${worldCount}개)에 적용`}
        </button>
      )}
    </section>
  );
}

export default function WorldTab({
  worlds,
  currentWorld,
  characters,
  facilities,
  onSelectWorld,
  onAddWorld,
  onUpdateWorld,
  onDeleteWorld,
  onApplyTimelineToAll,
  onOpenAddCharacter,
  onOpenCharacter,
  onFulfillWish,
  onAddFacility,
  onUpdateFacility,
}: WorldTabProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const residents = charactersInWorld(characters, currentWorld.id);
  const worldsFull = worlds.length >= WORLD_LIMIT;
  const totalFull = isTotalCharacterFull(characters);

  const submitWorld = () => {
    if (!newName.trim() || worldsFull) return;
    onAddWorld(newName.trim());
    setNewName("");
    setAdding(false);
  };

  const deleteWorld = () => {
    if (residents.length > 0) return;
    if (
      window.confirm(
        `'${currentWorld.name}' 세계를 삭제할까요?\n이 세계의 시설과 이벤트도 함께 사라집니다.`
      )
    ) {
      onDeleteWorld(currentWorld.id);
    }
  };

  return (
    <div className="space-y-4 px-4 py-4 pb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-1.5 font-[family-name:var(--font-display)] text-sm text-[var(--ink)]">
            <Earth className="h-4 w-4 text-[var(--accent)]" />
            세계
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">
            캐릭터들이 살아가는 곳. 세계마다 장소와 시간의 흐름이 달라요.
          </p>
          <p className="mt-1 text-[10.5px] tabular-nums text-[var(--muted)]">
            세계{" "}
            <span className={worldsFull ? "font-semibold text-red-600" : "font-semibold text-[var(--ink)]"}>
              {worlds.length}/{WORLD_LIMIT}
            </span>
            {" · "}전체 캐릭터{" "}
            <span className={totalFull ? "font-semibold text-red-600" : "font-semibold text-[var(--ink)]"}>
              {characters.length}/{TOTAL_CHARACTER_LIMIT}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          disabled={worldsFull}
          title={worldsFull ? `세계는 최대 ${WORLD_LIMIT}개까지 만들 수 있어요` : undefined}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[var(--accent)] px-3 py-2 text-[11px] font-medium text-white disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />새 세계
        </button>
      </div>

      {worldsFull && (
        <p className="-mt-2 text-[10.5px] text-[var(--muted)]">
          세계는 최대 {WORLD_LIMIT}개까지 만들 수 있어요. 새로 만들려면 비어 있는 세계를 삭제해 주세요.
        </p>
      )}

      {adding && !worldsFull && (
        <div className="flex gap-2 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3">
          <input
            type="text"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (isSubmitEnter(e)) submitWorld();
            }}
            placeholder="세계 이름 (예: 별빛 마법학교)"
            className={inputClass}
          />
          <button
            type="button"
            onClick={submitWorld}
            disabled={!newName.trim()}
            className="shrink-0 rounded-xl bg-[var(--accent)] px-3 text-xs font-medium text-white disabled:opacity-40"
          >
            만들기
          </button>
        </div>
      )}

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="세계 선택">
        {worlds.map((w) => {
          const active = w.id === currentWorld.id;
          const count = charactersInWorld(characters, w.id).length;
          return (
            <button
              key={w.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectWorld(w.id)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-left transition ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--wash)]"
              }`}
            >
              <span className="text-lg">{w.emoji}</span>
              <span className="min-w-0">
                <span className="block max-w-[8rem] truncate text-[12px] font-semibold">{w.name}</span>
                <span className={`block text-[10px] tabular-nums ${active ? "text-white/70" : "text-[var(--muted)]"}`}>
                  캐릭터 {count}/{WORLD_CHARACTER_LIMIT}
                  {w.timeline.speed === 0 ? " · 일시정지" : ""}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <WorldInfoCard
        key={`info-${currentWorld.id}`}
        world={currentWorld}
        onSave={(patch) => onUpdateWorld(currentWorld.id, patch)}
      />

      <ResidentsCard
        residents={residents}
        totalFull={totalFull}
        onAdd={onOpenAddCharacter}
        onOpen={onOpenCharacter}
      />

      <KeptWishesCard
        key={`wishes-${currentWorld.id}`}
        residents={residents}
        onOpen={onOpenCharacter}
        onFulfill={onFulfillWish}
      />

      <TimelineSettingsCard
        key={`timeline-${currentWorld.id}`}
        world={currentWorld}
        worldCount={worlds.length}
        onChange={(patch) =>
          onUpdateWorld(currentWorld.id, { timeline: { ...currentWorld.timeline, ...patch } })
        }
        onApplyToAll={() => onApplyTimelineToAll(currentWorld.timeline)}
      />

      <FacilitySection
        key={`facility-${currentWorld.id}`}
        facilities={facilities.filter((f) => f.worldId === currentWorld.id)}
        onAdd={(facility) => onAddFacility({ ...facility, worldId: currentWorld.id })}
        onUpdate={onUpdateFacility}
      />

      {worlds.length > 1 && (
        <div className="border-t border-[var(--line)] pt-4">
          <button
            type="button"
            onClick={deleteWorld}
            disabled={residents.length > 0}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-red-600/80 hover:bg-red-50 disabled:text-[var(--muted)] disabled:hover:bg-transparent"
          >
            <Trash2 className="h-3.5 w-3.5" />
            이 세계 삭제
          </button>
          {residents.length > 0 && (
            <p className="mt-1 px-2 text-[10.5px] text-[var(--muted)]">
              캐릭터가 사는 세계는 삭제할 수 없어요. 캐릭터 탭에서 다른 세계로 옮긴 뒤 삭제해 주세요.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
