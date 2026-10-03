"use client";

import { Check, MapPin, Plus, X } from "lucide-react";
import { useState } from "react";
import CharacterAvatar from "@/components/CharacterAvatar";
import { FACILITY_TYPES } from "@/components/FacilitySection";
import Modal from "@/components/Modal";
import { inputClass, LabelRow } from "@/components/ProfileFields";
import {
  applyPreset,
  createEventFacilityId,
  EVENT_EMOJIS,
  EVENT_FACILITY_LIMIT,
  EVENT_PRESETS,
  eventLength,
  findConflictingEvent,
  type EventDraft,
} from "@/data/events";
import { addDays } from "@/lib/date";
import type { CharacterProfile, EventFacility, FacilityType, StoryEvent } from "@/types";

const DURATIONS = [
  { label: "당일", days: 1 },
  { label: "2박 3일", days: 3 },
  { label: "1주일", days: 7 },
];

type FacilitiesUpdater = (update: (prev: EventFacility[]) => EventFacility[]) => void;

function EventFacilitiesField({
  facilities,
  onChange,
}: {
  facilities: EventFacility[];
  onChange: FacilitiesUpdater;
}) {
  const full = facilities.length >= EVENT_FACILITY_LIMIT;
  const patch = (id: string, value: Partial<EventFacility>) =>
    onChange((prev) => prev.map((f) => (f.id === id ? { ...f, ...value } : f)));

  return (
    <div>
      <LabelRow
        label={`무대 안의 시설 ${facilities.length}/${EVENT_FACILITY_LIMIT}`}
        hint="무대 안의 세부 장소예요 (예: 유럽 → 에펠탑, 콜로세움). 이벤트 기간에만 존재하고, 참여 캐릭터들은 날마다 이 중 한 곳에서 함께 시간을 보내요. 세계의 원래 시설에는 영향을 주지 않아요."
      />
      {facilities.length === 0 && (
        <p className="mb-2 rounded-xl bg-[var(--wash)] px-3 py-2.5 text-[11.5px] text-[var(--muted)]">
          아직 시설이 없어요. 비워 두면 무대 전체를 배경으로 지내요.
        </p>
      )}
      <ul className="space-y-2">
        {facilities.map((f) => (
          <li key={f.id} className="space-y-1.5 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-2.5">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
              <input
                type="text"
                value={f.name}
                onChange={(e) => patch(f.id, { name: e.target.value })}
                placeholder="세부 장소 이름"
                aria-label="시설 이름"
                className={inputClass}
              />
              <select
                value={f.type}
                onChange={(e) => patch(f.id, { type: e.target.value as FacilityType })}
                aria-label="시설 종류"
                className="shrink-0 rounded-xl border border-[var(--line)] bg-[var(--wash)] px-2 py-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              >
                {FACILITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onChange((prev) => prev.filter((x) => x.id !== f.id))}
                className="shrink-0 rounded-lg p-1.5 text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
                aria-label={`${f.name || "시설"} 삭제`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <textarea
              rows={2}
              value={f.description}
              onChange={(e) => patch(f.id, { description: e.target.value })}
              placeholder="어떤 곳인가요? (선택)"
              aria-label="시설 설명"
              className={inputClass}
            />
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={full}
        onClick={() =>
          onChange((prev) => [
            ...prev,
            { id: createEventFacilityId(), name: "", type: "건물", description: "" },
          ])
        }
        className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--accent)]/50 py-2 text-[11.5px] font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)]/50 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
        {full ? `시설은 최대 ${EVENT_FACILITY_LIMIT}곳까지` : "무대 안에 시설 추가"}
      </button>
    </div>
  );
}

interface EventEditorModalProps {
  initial: EventDraft;
  /** 수정 중인 이벤트 id. 없으면 새로 만들기 */
  eventId?: string;
  worldName: string;
  residents: CharacterProfile[];
  /** 이 세계의 모든 이벤트 (기간 겹침 확인용) */
  worldEvents: StoryEvent[];
  notice?: string;
  onSave: (draft: EventDraft) => void;
  onClose: () => void;
}

export default function EventEditorModal({
  initial,
  eventId,
  worldName,
  residents,
  worldEvents,
  notice,
  onSave,
  onClose,
}: EventEditorModalProps) {
  const [draft, setDraft] = useState(initial);
  const set = (patch: Partial<EventDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const residentIds = new Set(residents.map((c) => c.id));
  const selectedIds = draft.participantIds.filter((id) => residentIds.has(id));
  const periodValid = Boolean(draft.startDate && draft.endDate) && draft.endDate >= draft.startDate;
  const conflictOf = (id: string) =>
    periodValid ? findConflictingEvent(id, draft, worldEvents, eventId) : undefined;
  const conflicted = selectedIds.filter((id) => conflictOf(id));
  const canSave = draft.title.trim() !== "" && periodValid && conflicted.length === 0;

  const toggle = (id: string) =>
    setDraft((d) => ({
      ...d,
      participantIds: d.participantIds.includes(id)
        ? d.participantIds.filter((x) => x !== id)
        : [...d.participantIds, id],
    }));

  const save = () => {
    if (!canSave) return;
    onSave({
      ...draft,
      title: draft.title.trim(),
      location: draft.location.trim(),
      description: draft.description.trim(),
      participantIds: selectedIds,
      facilities: draft.facilities
        .map((f) => ({ ...f, name: f.name.trim(), description: f.description.trim() }))
        .filter((f) => f.name),
    });
  };

  return (
    <Modal
      title={eventId ? "이벤트 편집" : "새 이벤트"}
      subtitle={`${worldName}에서 열리는 이벤트`}
      onClose={onClose}
    >
      <div className="space-y-5 px-4 py-4">
        {notice && (
          <p className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-[11.5px] text-[var(--accent)]">
            {notice}
          </p>
        )}

        {!eventId && (
          <div>
            <LabelRow label="예시로 시작하기" />
            <div className="flex flex-wrap gap-1.5">
              {EVENT_PRESETS.map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => setDraft((d) => applyPreset(d, preset))}
                  className={`rounded-full border px-3 py-1.5 text-[11.5px] transition ${
                    draft.title === preset.title
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--line)] text-[var(--ink)] hover:bg-[var(--wash)]"
                  }`}
                >
                  {preset.emoji} {preset.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <LabelRow label="이벤트 이름" required />
          <div className="mb-2 flex flex-wrap gap-1">
            {EVENT_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => set({ emoji: e })}
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
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="예: 유럽 여행, 콘서트 관람, 연애 프로그램 출연"
            className={inputClass}
          />
        </div>

        <div>
          <LabelRow
            label="어떤 이벤트인가요?"
            hint="상황·분위기·규칙을 적어 주면 이벤트 기간 동안 참여 캐릭터의 타임라인과 SNS에 반영돼요."
          />
          <textarea
            rows={4}
            value={draft.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="예: 배가 고장 나 무인도에 표류했다. 물과 불을 구하고 탈출 방법을 찾아야 한다."
            className={inputClass}
          />
        </div>

        <div>
          <LabelRow
            label="무대"
            hint="이벤트가 펼쳐지는 넓은 배경이에요 (예: 유럽, 무인도). 그 안의 세부 장소는 아래 시설로 만들어요. 비워 두면 이벤트 이름으로 표시돼요."
          />
          <input
            type="text"
            value={draft.location}
            onChange={(e) => set({ location: e.target.value })}
            placeholder="예: 유럽, 이름 없는 무인도, 바닷가 셰어하우스"
            className={inputClass}
          />
          <div className="mt-3 border-l-2 border-[var(--accent)]/30 pl-3">
            <EventFacilitiesField
              facilities={draft.facilities}
              onChange={(update) => setDraft((d) => ({ ...d, facilities: update(d.facilities) }))}
            />
          </div>
        </div>

        <div>
          <LabelRow label="기간" required />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <input
              type="date"
              value={draft.startDate}
              onChange={(e) => {
                const startDate = e.target.value;
                set({
                  startDate,
                  endDate: startDate && draft.endDate < startDate ? startDate : draft.endDate,
                });
              }}
              className={inputClass}
              aria-label="시작일"
            />
            <span className="text-xs text-[var(--muted)]">~</span>
            <input
              type="date"
              value={draft.endDate}
              min={draft.startDate}
              onChange={(e) => set({ endDate: e.target.value })}
              className={inputClass}
              aria-label="종료일"
            />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d.label}
                type="button"
                disabled={!draft.startDate}
                onClick={() => set({ endDate: addDays(draft.startDate, d.days - 1) })}
                className="rounded-full bg-[var(--wash)] px-2.5 py-1 text-[11px] text-[var(--ink)] hover:bg-[var(--line)] disabled:opacity-40"
              >
                {d.label}
              </button>
            ))}
            <span className="ml-auto text-[11px] tabular-nums text-[var(--muted)]">
              {periodValid ? `${eventLength(draft)}일간` : "종료일을 확인해 주세요"}
            </span>
          </div>
        </div>

        <div>
          <LabelRow
            label={`참여 캐릭터 ${selectedIds.length}/${residents.length}`}
            hint="이 세계에 사는 캐릭터만 참여할 수 있어요. 한 캐릭터는 같은 기간에 이벤트 하나에만 참여할 수 있어요."
          />
          {residents.length === 0 ? (
            <p className="rounded-xl bg-[var(--wash)] px-3 py-3 text-center text-[11.5px] text-[var(--muted)]">
              이 세계에 사는 캐릭터가 없어요. 캐릭터를 먼저 데려와 주세요.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {residents.map((c) => {
                const selected = selectedIds.includes(c.id);
                const conflict = conflictOf(c.id);
                const blocked = Boolean(conflict) && !selected;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => toggle(c.id)}
                      disabled={blocked}
                      aria-pressed={selected}
                      className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        selected && conflict
                          ? "border-red-300 bg-red-50"
                          : selected
                            ? "border-[var(--accent)] bg-[var(--accent-soft)]/60"
                            : "border-[var(--line)] hover:bg-[var(--wash)]"
                      }`}
                    >
                      <CharacterAvatar
                        url={c.avatarUrl}
                        color={c.avatarColor}
                        name={c.name}
                        size="xs"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-[var(--ink)]">
                          {c.name}
                        </span>
                        {conflict && (
                          <span className={`block truncate text-[10.5px] ${selected ? "text-red-600" : "text-[var(--muted)]"}`}>
                            {conflict.emoji} &apos;{conflict.title}&apos; 이벤트와 기간이 겹쳐요
                          </span>
                        )}
                      </span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          selected
                            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                            : "border-[var(--line)]"
                        }`}
                      >
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {conflicted.length > 0 && (
            <p className="mt-2 text-[11px] text-red-600">
              기간이 겹치는 캐릭터가 있어요. 기간을 바꾸거나 참여를 해제해 주세요.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--line)] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs text-[var(--muted)] hover:bg-[var(--wash)]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
          >
            {eventId ? "저장" : "만들기"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
