"use client";

import {
  ChevronDown,
  Copy,
  MapPin,
  PartyPopper,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import CharacterAvatar from "@/components/CharacterAvatar";
import EventEditorModal from "@/components/EventEditorModal";
import Modal from "@/components/Modal";
import {
  applyPreset,
  blankEventDraft,
  createEventId,
  EVENT_PRESETS,
  eventDayLabel,
  eventLength,
  eventParticipants,
  eventPlace,
  eventSpotOn,
  eventStatus,
  type EventDraft,
  type EventStatus,
} from "@/data/events";
import { charactersInWorld } from "@/data/worlds";
import { daysBetween, formatMonthDay, toDateKey } from "@/lib/date";
import type { CharacterProfile, StoryEvent, World } from "@/types";

export type EventRecordCounts = Record<string, { logs: number; posts: number }>;

interface EventTabProps {
  world: World;
  worlds: World[];
  /** 모든 세계의 캐릭터 */
  characters: CharacterProfile[];
  /** 모든 세계의 이벤트 */
  events: StoryEvent[];
  recordCounts: EventRecordCounts;
  onSave: (event: StoryEvent) => void;
  onDelete: (id: string) => void;
  /** 다른 세계로 복사하고 그 세계로 이동. 만들어진 복사본을 돌려준다 */
  onCopy: (id: string, worldId: string) => StoryEvent | undefined;
  onOpenCharacter: (id: string) => void;
}

interface EditorState {
  eventId?: string;
  initial: EventDraft;
  notice?: string;
}

function toDraft({ id: _id, worldId: _worldId, ...draft }: StoryEvent): EventDraft {
  return draft;
}

function formatPeriod(event: StoryEvent) {
  return event.startDate === event.endDate
    ? formatMonthDay(event.startDate)
    : `${formatMonthDay(event.startDate)} ~ ${formatMonthDay(event.endDate)}`;
}

function StatusBadge({ event, status, today }: { event: StoryEvent; status: EventStatus; today: string }) {
  if (status === "ongoing") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-white">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--point)]" aria-hidden />
        진행 중 · {eventDayLabel(event, today)}
      </span>
    );
  }
  if (status === "upcoming") {
    const left = daysBetween(today, event.startDate);
    return (
      <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
        {left === 1 ? "내일 시작" : `D-${left}`}
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-[var(--wash)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
      종료
    </span>
  );
}

function EventFacilityList({
  event,
  todaySpotId,
}: {
  event: StoryEvent;
  /** 진행 중인 이벤트에서 오늘 머무는 시설 */
  todaySpotId?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 rounded-xl bg-[var(--card)]/70 px-3 py-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 text-left text-[11.5px] font-semibold text-[var(--ink)]"
        aria-expanded={open}
      >
        <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
        <span className="min-w-0 truncate">
          {eventPlace(event)} 안의 시설 {event.facilities.length}곳
        </span>
        <ChevronDown className={`ml-auto h-3.5 w-3.5 text-[var(--muted)] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <ul className="mt-2 space-y-2">
          {event.facilities.map((f) => (
            <li key={f.id}>
              <p className="flex flex-wrap items-center gap-1.5 text-[12px] font-medium text-[var(--ink)]">
                {f.name}
                <span className="rounded-md bg-[var(--wash)] px-1.5 py-0.5 text-[10px] font-normal text-[var(--muted)]">
                  {f.type}
                </span>
                {f.id === todaySpotId && (
                  <span className="rounded-md bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    오늘 여기
                  </span>
                )}
              </p>
              {f.description && (
                <p className="mt-0.5 text-[11.5px] leading-5 text-[var(--ink)]/75">{f.description}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {event.facilities.map((f) => (
            <span
              key={f.id}
              className={`rounded-md px-1.5 py-0.5 text-[10.5px] ${
                f.id === todaySpotId
                  ? "bg-[var(--accent)] font-semibold text-white"
                  : "bg-[var(--wash)] text-[var(--ink)]/80"
              }`}
            >
              {f.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  status,
  today,
  participants,
  records,
  canCopy,
  onEdit,
  onCopy,
  onDelete,
  onOpenCharacter,
}: {
  event: StoryEvent;
  status: EventStatus;
  today: string;
  participants: CharacterProfile[];
  records?: { logs: number; posts: number };
  canCopy: boolean;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onOpenCharacter: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const ended = status === "ended";
  const actionClass =
    "inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition disabled:opacity-40";

  return (
    <article
      className={`rounded-2xl p-4 ${
        status === "ongoing" ? "event-frame" : "border border-[var(--line)] bg-[var(--paper)]"
      } ${ended ? "opacity-80" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--wash)] text-2xl">
          {event.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 truncate text-[14px] font-semibold text-[var(--ink)]">
              {event.title}
            </h3>
            <StatusBadge event={event} status={status} today={today} />
          </div>
          <p className="mt-0.5 text-[11px] tabular-nums text-[var(--muted)]">
            {formatPeriod(event)} · {eventLength(event)}일
          </p>
          {event.location.trim() && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--muted)]">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">무대 · {event.location}</span>
            </p>
          )}
        </div>
      </div>

      {event.facilities.length > 0 && (
        <EventFacilityList
          event={event}
          todaySpotId={status === "ongoing" ? eventSpotOn(event, today)?.id : undefined}
        />
      )}

      {event.description && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 block w-full text-left"
          aria-expanded={expanded}
        >
          <p
            className={`text-[12.5px] leading-5 text-[var(--ink)]/85 whitespace-pre-wrap ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {event.description}
          </p>
        </button>
      )}

      <div className="mt-3 flex items-center gap-2">
        {participants.length === 0 ? (
          <p className="text-[11px] text-[var(--muted)]">
            참여 캐릭터가 없어요{ended ? "" : " · 편집에서 골라 주세요"}
          </p>
        ) : (
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {participants.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onOpenCharacter(c.id)}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--card)] py-0.5 pl-0.5 pr-2 text-[11px] text-[var(--ink)] hover:bg-[var(--wash)]"
              >
                <CharacterAvatar
                  url={c.avatarUrl}
                  color={c.avatarColor}
                  name={c.name}
                  size="xs"
                />
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {records && records.logs + records.posts > 0 && (
        <p className="mt-2 text-[10.5px] text-[var(--muted)]">
          이 이벤트로 남은 기록 · 타임라인 {records.logs}건 · SNS {records.posts}건
        </p>
      )}

      <div className="mt-3 flex items-center gap-1 border-t border-[var(--line)] pt-2.5">
        <button
          type="button"
          onClick={onEdit}
          className={`${actionClass} bg-[var(--wash)] text-[var(--ink)] hover:bg-[var(--line)]`}
        >
          {ended ? <RotateCcw className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
          {ended ? "다시 열기" : "편집"}
        </button>
        <button
          type="button"
          onClick={onCopy}
          disabled={!canCopy}
          title={canCopy ? undefined : "복사할 다른 세계가 없어요"}
          className={`${actionClass} text-[var(--ink)] hover:bg-[var(--wash)]`}
        >
          <Copy className="h-3 w-3" />
          다른 세계로 복사
        </button>
        <button
          type="button"
          onClick={onDelete}
          className={`${actionClass} ml-auto text-red-600/80 hover:bg-red-50`}
        >
          <Trash2 className="h-3 w-3" />
          삭제
        </button>
      </div>
    </article>
  );
}

function CopyEventModal({
  event,
  worlds,
  characters,
  onCopy,
  onClose,
}: {
  event: StoryEvent;
  worlds: World[];
  characters: CharacterProfile[];
  onCopy: (worldId: string) => void;
  onClose: () => void;
}) {
  const targets = worlds.filter((w) => w.id !== event.worldId);
  return (
    <Modal title="다른 세계로 복사" subtitle={`${event.emoji} ${event.title}`} onClose={onClose}>
      <div className="space-y-3 px-4 py-4">
        <p className="text-[11.5px] leading-5 text-[var(--muted)]">
          이벤트 내용과 기간이 그대로 복사돼요. 세계가 다르면 서로를 모르기 때문에 참여 캐릭터는 그 세계에서 새로 골라 주세요.
        </p>
        <ul className="space-y-1.5">
          {targets.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => onCopy(w.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-[var(--line)] px-3 py-2.5 text-left hover:bg-[var(--wash)]"
              >
                <span className="text-xl">{w.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-[var(--ink)]">{w.name}</span>
                  <span className="block text-[10.5px] text-[var(--muted)]">
                    캐릭터 {charactersInWorld(characters, w.id).length}명
                  </span>
                </span>
                <Copy className="h-4 w-4 shrink-0 text-[var(--muted)]" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}

const SECTION_ORDER: { status: EventStatus; label: string }[] = [
  { status: "ongoing", label: "진행 중" },
  { status: "upcoming", label: "예정" },
  { status: "ended", label: "지난 이벤트" },
];

export default function EventTab({
  world,
  worlds,
  characters,
  events,
  recordCounts,
  onSave,
  onDelete,
  onCopy,
  onOpenCharacter,
}: EventTabProps) {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [showEnded, setShowEnded] = useState(false);

  const today = toDateKey(new Date());
  const residents = charactersInWorld(characters, world.id);
  const worldEvents = events.filter((e) => e.worldId === world.id);
  const grouped: Record<EventStatus, StoryEvent[]> = { ongoing: [], upcoming: [], ended: [] };
  for (const e of worldEvents) grouped[eventStatus(e, today)].push(e);
  grouped.ongoing.sort((a, b) => a.endDate.localeCompare(b.endDate));
  grouped.upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate));
  grouped.ended.sort((a, b) => b.endDate.localeCompare(a.endDate));

  // 편집 중에 세계가 바뀌어 이벤트가 안 보이게 되면 편집창도 닫힌다
  const editorVisible =
    editor !== null && (!editor.eventId || worldEvents.some((e) => e.id === editor.eventId));
  const copying = copyingId ? worldEvents.find((e) => e.id === copyingId) : undefined;

  const openCreate = (draft = blankEventDraft(today)) => setEditor({ initial: draft });

  const save = (draft: EventDraft) => {
    onSave({ ...draft, id: editor?.eventId ?? createEventId(), worldId: world.id });
    setEditor(null);
  };

  const remove = (event: StoryEvent) => {
    if (
      window.confirm(
        `'${event.title}' 이벤트를 삭제할까요?\n이미 작성된 타임라인과 SNS 기록은 그대로 남아요.`
      )
    ) {
      onDelete(event.id);
    }
  };

  const copyTo = (event: StoryEvent, worldId: string) => {
    const copy = onCopy(event.id, worldId);
    setCopyingId(null);
    if (!copy) return;
    const target = worlds.find((w) => w.id === worldId);
    setEditor({
      eventId: copy.id,
      initial: toDraft(copy),
      notice: `${target?.emoji ?? ""} ${target?.name ?? "다른 세계"}에 복사했어요. 이 세계에서 참여할 캐릭터를 골라 주세요.`,
    });
  };

  return (
    <div className="space-y-4 px-4 py-4 pb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-1.5 font-[family-name:var(--font-display)] text-sm text-[var(--ink)]">
            <PartyPopper className="h-4 w-4 text-[var(--accent)]" />
            이벤트
          </h2>
          <p className="mt-0.5 text-[11px] leading-5 text-[var(--muted)]">
            캐릭터들을 원하는 이야기로 이끌어 보세요. 이벤트 기간 동안 참여한 캐릭터의 타임라인과 SNS가 그 이벤트를 따라 작성돼요.
          </p>
          <p className="mt-1 text-[10.5px] text-[var(--muted)]">
            {world.emoji} {world.name}의 이벤트 {worldEvents.length}개
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreate()}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[var(--accent)] px-3 py-2 text-[11px] font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" />새 이벤트
        </button>
      </div>

      {world.timeline.speed === 0 && (
        <p className="rounded-xl bg-[var(--wash)] px-3 py-2 text-[11px] text-[var(--muted)]">
          이 세계는 시간이 멈춰 있어서, 일시정지를 풀기 전까지 이벤트 기록이 작성되지 않아요.
        </p>
      )}

      {worldEvents.length === 0 && (
        <section className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-8 text-center">
          <p className="text-2xl">🎪</p>
          <p className="mt-2 text-[13px] font-medium text-[var(--ink)]">아직 열린 이벤트가 없어요</p>
          <p className="mt-1 text-[11px] text-[var(--muted)]">
            여행, 콘서트 같은 일상 이벤트부터 특이한 콘셉트까지 자유롭게 만들 수 있어요.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {EVENT_PRESETS.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => openCreate(applyPreset(blankEventDraft(today), preset))}
                className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-[11.5px] text-[var(--ink)] hover:bg-[var(--wash)]"
              >
                {preset.emoji} {preset.title}
              </button>
            ))}
          </div>
        </section>
      )}

      {SECTION_ORDER.map(({ status, label }) => {
        const list = grouped[status];
        if (list.length === 0) return null;
        const collapsible = status === "ended";
        const open = !collapsible || showEnded;
        return (
          <section key={status} className="space-y-2.5">
            {collapsible ? (
              <button
                type="button"
                onClick={() => setShowEnded((v) => !v)}
                className="flex w-full items-center gap-1.5 px-1 text-[12px] font-semibold text-[var(--muted)]"
                aria-expanded={open}
              >
                {label} {list.length}
                <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
                <span className="ml-auto text-[10.5px] font-normal">
                  다시 열어 기간이나 참여 캐릭터를 바꿀 수 있어요
                </span>
              </button>
            ) : (
              <h3 className="px-1 text-[12px] font-semibold text-[var(--ink)]">
                {label} {list.length}
              </h3>
            )}
            {open &&
              list.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  status={status}
                  today={today}
                  participants={eventParticipants(event, characters)}
                  records={recordCounts[event.id]}
                  canCopy={worlds.length > 1}
                  onEdit={() => setEditor({ eventId: event.id, initial: toDraft(event) })}
                  onCopy={() => setCopyingId(event.id)}
                  onDelete={() => remove(event)}
                  onOpenCharacter={onOpenCharacter}
                />
              ))}
          </section>
        );
      })}

      {editor && editorVisible && (
        <EventEditorModal
          key={editor.eventId ?? "new"}
          initial={editor.initial}
          eventId={editor.eventId}
          worldName={world.name}
          residents={residents}
          worldEvents={worldEvents}
          notice={editor.notice}
          onSave={save}
          onClose={() => setEditor(null)}
        />
      )}

      {copying && (
        <CopyEventModal
          event={copying}
          worlds={worlds}
          characters={characters}
          onCopy={(worldId) => copyTo(copying, worldId)}
          onClose={() => setCopyingId(null)}
        />
      )}
    </div>
  );
}
