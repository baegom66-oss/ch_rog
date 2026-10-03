"use client";

import { Plus } from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import AddCharacterModal from "@/components/AddCharacterModal";
import type { AiGenerateKind } from "@/components/AiSettingsSection";
import BottomNav from "@/components/BottomNav";
import CharacterTab from "@/components/CharacterTab";
import EventTab, { type EventRecordCounts } from "@/components/EventTab";
import FavoritesVault from "@/components/FavoritesVault";
import Header from "@/components/Header";
import SettingsPanel from "@/components/SettingsPanel";
import SnsTab from "@/components/SnsTab";
import TimelineTab from "@/components/TimelineTab";
import WorldTab from "@/components/WorldTab";
import {
  createBlankCharacter,
  withMutualRelationships,
} from "@/data/createCharacter";
import {
  FAVORITE_SLOT_MAX,
  initialCharacters,
  initialFacilities,
  initialLogs,
  initialSchedules,
  initialSnsPosts,
  SNS_FAVORITE_MAX,
} from "@/data/dummy";
import {
  activeEventFor,
  copyEventToWorld,
  eventStatus,
  findConflictingEvent,
} from "@/data/events";
import { setMutualRelationship } from "@/data/relationships";
import {
  countByWorld,
  createWorld,
  initialWorlds,
  isTotalCharacterFull,
  isWorldFull,
  pausedWorldIds,
  WORLD_LIMIT,
} from "@/data/worlds";
import {
  loadAiSettings,
  loadCharacterProfiles,
  loadEvents,
  loadFacilities,
  loadSelectedCharacterId,
  loadSelectedWorldId,
  loadSnsAutoPostEnabled,
  loadSnsPosts,
  loadStoredList,
  loadWorlds,
  saveSelectedCharacterId,
  saveSelectedWorldId,
  saveSnsAutoPostEnabled,
  STORAGE_KEYS,
} from "@/lib/persistence";
import {
  generateSnsComment,
  generateSnsContent,
  generateTimelineLog,
  type AiWorldContext,
} from "@/lib/aiGenerate";
import { runDailyWish } from "@/lib/dailyWish";
import { toDateKey, toTimeKey } from "@/lib/date";
import { runEventLogs } from "@/lib/eventStory";
import { logSortKey, trimLogs } from "@/lib/logRetention";
import { favoritePostCount, postBlockedIds, trimPosts } from "@/lib/postRetention";
import { buildAutoPost, runSnsAutoPost } from "@/lib/snsAutoPost";
import { runSnsComments } from "@/lib/snsEngagement";
import { collectTimelineJobs } from "@/lib/timelineAuto";
import { useStoredState } from "@/lib/useStoredState";
import type {
  ActionLog,
  AiSettings,
  AiStatus,
  CharacterProfile,
  CharacterRelationship,
  Facility,
  ScheduleItem,
  SnsComment,
  SnsPost,
  StoryEvent,
  TabId,
  TimelineFilter,
  World,
  WorldTimelineSettings,
} from "@/types";

const SNS_AUTO_POST_CHECK_MS = 30_000;
const WISH_CHECK_MS = 30_000;
const TIMELINE_CHECK_MS = 30_000;

/** 곧바로 한 번 실행한 뒤 ms마다 반복. effect cleanup 함수를 돌려준다 */
function runNowAndEvery(task: () => void, ms: number) {
  const first = setTimeout(task, 0);
  const interval = setInterval(task, ms);
  return () => {
    clearTimeout(first);
    clearInterval(interval);
  };
}

function EmptyWorld({ world, onAdd }: { world: World; onAdd: () => void }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-3xl">{world.emoji}</p>
      <p className="mt-3 text-sm font-medium text-[var(--ink)]">
        {world.name}에는 아직 아무도 살지 않아요
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        이 세계에서 살아갈 캐릭터를 데려와 보세요.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white"
      >
        <Plus className="h-3.5 w-3.5" />
        캐릭터 추가
      </button>
    </div>
  );
}

export default function SimulatorApp() {
  const [tab, setTab] = useState<TabId>("timeline");
  const [characters, setCharacters] = useStoredState<CharacterProfile[]>(
    STORAGE_KEYS.characterProfiles,
    () => loadCharacterProfiles(initialCharacters)
  );
  const [selectedId, setSelectedId] = useState(() =>
    loadSelectedCharacterId(characters)
  );
  const [worlds, setWorlds] = useStoredState<World[]>(STORAGE_KEYS.worlds, () =>
    loadWorlds(initialWorlds)
  );
  const [worldId, setWorldId] = useState(() =>
    loadSelectedWorldId(worlds, characters, selectedId)
  );
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all");
  const [snsAutoPostEnabled, setSnsAutoPostEnabled] = useState(
    loadSnsAutoPostEnabled
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [addCharacterOpen, setAddCharacterOpen] = useState(false);
  const [logs, setLogs] = useStoredState<ActionLog[]>(
    STORAGE_KEYS.actionLogs,
    () => trimLogs(loadStoredList(STORAGE_KEYS.actionLogs, initialLogs))
  );
  const [schedules, setSchedules] = useStoredState<ScheduleItem[]>(
    STORAGE_KEYS.schedules,
    () => loadStoredList(STORAGE_KEYS.schedules, initialSchedules)
  );
  const [facilities, setFacilities] = useStoredState<Facility[]>(
    STORAGE_KEYS.facilities,
    () => loadFacilities(initialFacilities)
  );
  const [posts, setPosts] = useStoredState<SnsPost[]>(
    STORAGE_KEYS.snsPosts,
    () => trimPosts(loadSnsPosts(initialSnsPosts, toDateKey(new Date())))
  );
  const [events, setEvents] = useStoredState<StoryEvent[]>(STORAGE_KEYS.events, loadEvents);
  const [aiSettings, setAiSettings] = useStoredState<AiSettings>(
    STORAGE_KEYS.aiSettings,
    loadAiSettings
  );
  const [aiStatus, setAiStatus] = useState<AiStatus>({ pending: 0 });
  const aiActive = aiSettings.enabled && aiSettings.apiKey !== "";
  const aiConfig = { apiKey: aiSettings.apiKey, model: aiSettings.model };

  const currentWorld = worlds.find((w) => w.id === worldId) ?? worlds[0];
  const worldCharacters = useMemo(
    () => characters.filter((c) => c.worldId === currentWorld.id),
    [characters, currentWorld.id]
  );
  const selected: CharacterProfile | undefined =
    worldCharacters.find((c) => c.id === selectedId) ?? worldCharacters[0];
  const selectedCharacterId = selected?.id ?? "";
  const speed = currentWorld.timeline.speed;

  const worldPopulation = useMemo(() => countByWorld(characters), [characters]);

  useEffect(() => saveSelectedCharacterId(selectedId), [selectedId]);
  useEffect(() => saveSelectedWorldId(currentWorld.id), [currentWorld.id]);
  useEffect(
    () => saveSnsAutoPostEnabled(snsAutoPostEnabled),
    [snsAutoPostEnabled]
  );

  const addLogs = (generated: ActionLog[]) => {
    if (generated.length === 0) return;
    setLogs((prev) => {
      const ids = new Set(prev.map((l) => l.id));
      const fresh = generated.filter((l) => !ids.has(l.id));
      return fresh.length > 0 ? trimLogs([...fresh, ...prev]) : prev;
    });
  };

  /** 즐겨찾기가 가득 찬 캐릭터의 글은 올리지 않고, 캐릭터별 보관 한도를 넘는 오래된 글은 지운다 */
  const addPosts = (generated: SnsPost[]) => {
    if (generated.length === 0) return;
    setPosts((prev) => {
      const ids = new Set(prev.map((p) => p.id));
      const blocked = postBlockedIds(prev);
      const fresh = generated.filter((p) => !ids.has(p.id) && !blocked.has(p.characterId));
      return fresh.length > 0 ? trimPosts([...fresh, ...prev]) : prev;
    });
  };

  const togglePostFavorite = (id: string) => {
    setPosts((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target) return prev;
      if (!target.isFavorite && favoritePostCount(prev, target.characterId) >= SNS_FAVORITE_MAX) {
        return prev;
      }
      return prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
    });
  };

  const aiContext = (currentEvents: StoryEvent[] = events): AiWorldContext => ({
    characters,
    worlds,
    facilities,
    events: currentEvents,
    logs,
    posts,
    schedules,
  });

  /** 진행 상황을 aiStatus에 반영하며 AI 작업을 실행한다. 실패하면 그대로 던진다 */
  const runAi = async <T,>(task: () => Promise<T>): Promise<T> => {
    setAiStatus((s) => ({ ...s, pending: s.pending + 1 }));
    try {
      const result = await task();
      setAiStatus((s) => ({
        pending: s.pending - 1,
        lastSuccessAt: new Date().toISOString(),
      }));
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "AI 생성에 실패했어요.";
      setAiStatus((s) => ({
        ...s,
        pending: s.pending - 1,
        lastError: { message, at: new Date().toISOString() },
      }));
      throw e;
    }
  };

  const addComment = (postId: string, comment: SnsComment) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId && !p.comments.some((c) => c.id === comment.id)
          ? { ...p, comments: [...p.comments, comment] }
          : p
      )
    );
  };

  /** 관계·사회성에 따라 정해진 댓글 중 시각이 된 것을 단다 */
  const appendSnsComments = (now: Date) => {
    const jobs = runSnsComments(characters, posts, now, pausedWorldIds(worlds));
    if (jobs.length === 0) return;
    const ctx = aiContext();
    for (const { post, commenter, comment } of jobs) {
      if (!aiActive) {
        addComment(post.id, comment);
        continue;
      }
      void runAi(() =>
        generateSnsComment(aiConfig, ctx, commenter, post, toDateKey(now), comment.time)
      ).then(
        (content) => addComment(post.id, { ...comment, content }),
        () => addComment(post.id, comment)
      );
    }
  };

  // effect event라 항상 최신 state를 읽으므로, state가 바뀌어도 interval을 다시 만들지 않는다
  const tickSnsAutoPost = useEffectEvent(() => {
    const now = new Date();
    appendSnsComments(now);
    const generated = runSnsAutoPost(characters, posts, events, now, pausedWorldIds(worlds));
    if (!aiActive) {
      addPosts(generated);
      return;
    }
    // 공유 글은 원본을 가리키기만 하므로 그대로, 직접 쓰는 글만 AI가 작성한다
    addPosts(generated.filter((p) => p.sharedPostId));
    const ctx = aiContext();
    for (const fallback of generated.filter((p) => !p.sharedPostId)) {
      const author = characters.find((c) => c.id === fallback.characterId);
      if (!author) continue;
      void runAi(() =>
        generateSnsContent(aiConfig, ctx, author, fallback.date ?? toDateKey(new Date()), fallback.time)
      ).then(
        (written) => addPosts([{ ...fallback, ...written }]),
        () => addPosts([fallback])
      );
    }
  });

  const tickDailyWish = useEffectEvent(() => {
    const changes = runDailyWish(characters, new Date(), pausedWorldIds(worlds));
    if (Object.keys(changes).length === 0) return;
    setCharacters((prev) =>
      prev.map((c) => (changes[c.id] ? { ...c, wishes: changes[c.id] } : c))
    );
  });

  useEffect(() => {
    if (!snsAutoPostEnabled) return;
    return runNowAndEvery(tickSnsAutoPost, SNS_AUTO_POST_CHECK_MS);
  }, [snsAutoPostEnabled]);

  /**
   * AI가 꺼져 있으면 이벤트 참여자만 하루 한 번 템플릿 로그를 남긴다.
   * 켜져 있으면 세계별 빈도에 맞춰 모든 캐릭터의 로그를 AI가 쓰고, 실패하면 이벤트 템플릿으로 대신한다.
   */
  const appendTimelineLogs = (currentEvents: StoryEvent[]) => {
    if (!aiActive) {
      addLogs(runEventLogs(characters, currentEvents, logs, new Date(), pausedWorldIds(worlds)));
      return;
    }
    const jobs = collectTimelineJobs(characters, worlds, currentEvents, logs, new Date());
    if (jobs.length === 0) return;
    const ctx = aiContext(currentEvents);
    for (const job of jobs) {
      void runAi(() => generateTimelineLog(aiConfig, ctx, job)).then(
        (log) => addLogs([log]),
        () => addLogs(job.fallback ? [job.fallback] : [])
      );
    }
  };
  const tickTimelineLogs = useEffectEvent(() => appendTimelineLogs(events));

  useEffect(() => runNowAndEvery(tickDailyWish, WISH_CHECK_MS), []);
  useEffect(() => runNowAndEvery(tickTimelineLogs, TIMELINE_CHECK_MS), []);

  const generateNow = async (kind: AiGenerateKind): Promise<string | undefined> => {
    if (!aiActive) return "AI 연동이 꺼져 있어요.";
    if (!selected) return "선택된 캐릭터가 없어요.";
    const now = new Date();
    const date = toDateKey(now);
    const time = toTimeKey(now);
    const ctx = aiContext();
    try {
      if (kind === "timeline") {
        const log = await runAi(() =>
          generateTimelineLog(aiConfig, ctx, {
            id: `ai-log-manual-${now.getTime()}`,
            character: selected,
            date,
            time,
          })
        );
        addLogs([log]);
      } else {
        if (postBlockedIds(posts).has(selected.id)) {
          return `${selected.name}의 즐겨찾기 ${SNS_FAVORITE_MAX}개가 가득 차서 새 게시물을 올릴 수 없어요.`;
        }
        const base = buildAutoPost(
          selected,
          characters,
          activeEventFor(selected, events, date),
          posts,
          `sns-ai-manual-${now.getTime()}`,
          date,
          time,
          false
        );
        const written = await runAi(() => generateSnsContent(aiConfig, ctx, selected, date, time));
        addPosts([{ ...base, ...written }]);
      }
      return undefined;
    } catch (e) {
      return e instanceof Error ? e.message : "생성에 실패했어요.";
    }
  };

  const worldCharacterIds = useMemo(
    () => new Set(worldCharacters.map((c) => c.id)),
    [worldCharacters]
  );

  const worldPosts = useMemo(
    () =>
      posts
        .filter((p) => worldCharacterIds.has(p.characterId))
        .map((p) =>
          p.comments.every((c) => worldCharacterIds.has(c.characterId))
            ? p
            : { ...p, comments: p.comments.filter((c) => worldCharacterIds.has(c.characterId)) }
        ),
    [posts, worldCharacterIds]
  );

  const updatePost = (id: string, patch: Partial<SnsPost>) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (!patch.comments) return { ...p, ...patch };
        // 다른 세계 캐릭터의 댓글은 화면에 안 보일 뿐 지우지 않고, 원래 순서도 지킨다
        const edited = new Map(patch.comments.map((c) => [c.id, c]));
        const comments = p.comments.flatMap((c) => {
          if (!worldCharacterIds.has(c.characterId)) return [c];
          const next = edited.get(c.id);
          edited.delete(c.id);
          return next ? [next] : [];
        });
        return { ...p, ...patch, comments: [...comments, ...edited.values()] };
      })
    );
  };

  const favoriteCount = useMemo(
    () => logs.filter((l) => l.isFavorite).length,
    [logs]
  );

  const effectiveFilter: TimelineFilter = worldCharacterIds.has(timelineFilter)
    ? timelineFilter
    : "all";

  const today = toDateKey(new Date());

  const feedLogs = useMemo(
    () =>
      logs
        .filter((l) =>
          effectiveFilter === "all"
            ? worldCharacterIds.has(l.characterId)
            : l.characterId === effectiveFilter
        )
        .sort((a, b) => logSortKey(b, today).localeCompare(logSortKey(a, today))),
    [logs, effectiveFilter, worldCharacterIds, today]
  );

  const feedSchedules = useMemo(
    () =>
      schedules
        .filter((s) => s.characterId === effectiveFilter)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [schedules, effectiveFilter]
  );

  const logCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of logs) counts[l.characterId] = (counts[l.characterId] ?? 0) + 1;
    return counts;
  }, [logs]);

  const eventRecordCounts = useMemo(() => {
    const counts: EventRecordCounts = {};
    const entry = (id: string) => (counts[id] ??= { logs: 0, posts: 0 });
    for (const l of logs) if (l.eventId) entry(l.eventId).logs += 1;
    for (const p of posts) if (p.eventId) entry(p.eventId).posts += 1;
    return counts;
  }, [logs, posts]);

  const ongoingWorldEvents = events.filter(
    (e) => e.worldId === currentWorld.id && eventStatus(e, today) === "ongoing"
  );
  const selectedEvent = selected ? activeEventFor(selected, events, today) : undefined;

  const switchWorld = (id: string) => {
    if (id === currentWorld.id) return;
    setWorldId(id);
    setTimelineFilter("all");
    const first = characters.find((c) => c.worldId === id);
    if (first) setSelectedId(first.id);
  };

  const handleTimelineFilterChange = (value: TimelineFilter) => {
    setTimelineFilter(value);
    if (value !== "all") setSelectedId(value);
  };

  const handleSelectCharacter = (id: string) => {
    const target = characters.find((c) => c.id === id);
    if (target && target.worldId !== currentWorld.id) {
      setWorldId(target.worldId);
      setTimelineFilter("all");
    } else if (timelineFilter !== "all") {
      setTimelineFilter(id);
    }
    setSelectedId(id);
  };

  const toggleFavorite = (id: string) => {
    setLogs((prev) => {
      const count = prev.filter((l) => l.isFavorite).length;
      return prev.map((log) => {
        if (log.id !== id) return log;
        if (!log.isFavorite && count >= FAVORITE_SLOT_MAX) return log;
        return { ...log, isFavorite: !log.isFavorite };
      });
    });
  };

  const patchCharacter = (id: string, patch: Partial<CharacterProfile>) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  };

  const updateSelectedCharacter = (patch: Partial<CharacterProfile>) => {
    if (!selectedCharacterId) return;
    patchCharacter(selectedCharacterId, {
      ...patch,
      profileUpdatedAt: new Date().toISOString(),
    });
  };

  const updateRelationship = (rel: CharacterRelationship) => {
    if (!selectedCharacterId) return;
    setCharacters((prev) => setMutualRelationship(prev, selectedCharacterId, rel));
  };

  const handleAddCharacter = (name: string, targetWorldId: string) => {
    if (isWorldFull(characters, targetWorldId) || isTotalCharacterFull(characters)) return;
    const newbie = createBlankCharacter(name, targetWorldId, characters);
    setCharacters((prev) => withMutualRelationships([...prev, newbie], newbie));
    setWorldId(targetWorldId);
    setTimelineFilter("all");
    setSelectedId(newbie.id);
    setTab("character");
  };

  const moveCharacterToWorld = (id: string, targetWorldId: string) => {
    const mover = characters.find((c) => c.id === id);
    if (!mover || mover.worldId === targetWorldId) return;
    if (isWorldFull(characters, targetWorldId)) return;
    const moved = { ...mover, worldId: targetWorldId };
    setCharacters((prev) =>
      withMutualRelationships(
        prev.map((c) => (c.id === id ? moved : c)),
        moved
      )
    );
    // 떠난 세계의 진행 중·예정 이벤트에서는 빠진다 (지난 이벤트 기록은 그대로)
    setEvents((prev) =>
      prev.map((e) =>
        e.worldId === mover.worldId &&
        eventStatus(e, today) !== "ended" &&
        e.participantIds.includes(id)
          ? { ...e, participantIds: e.participantIds.filter((p) => p !== id) }
          : e
      )
    );
    setWorldId(targetWorldId);
    setTimelineFilter("all");
    setSelectedId(id);
  };

  const fulfillWish = (characterId: string, wishId: string) => {
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === characterId
          ? { ...c, wishes: c.wishes.filter((w) => w.id !== wishId) }
          : c
      )
    );
  };

  /** 다른 세계 캐릭터나 기간이 겹치는 캐릭터가 들어 있으면 저장하지 않는다 */
  const saveEvent = (event: StoryEvent) => {
    const residentIds = new Set(
      characters.filter((c) => c.worldId === event.worldId).map((c) => c.id)
    );
    const next = {
      ...event,
      participantIds: event.participantIds.filter((id) => residentIds.has(id)),
    };
    const worldEvents = events.filter((e) => e.worldId === event.worldId);
    if (next.participantIds.some((id) => findConflictingEvent(id, next, worldEvents, next.id))) {
      return;
    }
    const nextEvents = events.some((e) => e.id === next.id)
      ? events.map((e) => (e.id === next.id ? next : e))
      : [...events, next];
    setEvents(nextEvents);
    appendTimelineLogs(nextEvents);
  };

  const copyEvent = (id: string, targetWorldId: string) => {
    const source = events.find((e) => e.id === id);
    if (!source || !worlds.some((w) => w.id === targetWorldId)) return undefined;
    const copy = copyEventToWorld(source, targetWorldId);
    setEvents((prev) => [...prev, copy]);
    switchWorld(targetWorldId);
    return copy;
  };

  const addWorld = (name: string) => {
    if (worlds.length >= WORLD_LIMIT) return;
    const world = createWorld(name, worlds);
    setWorlds((prev) => [...prev, world]);
    switchWorld(world.id);
  };

  const updateWorld = (id: string, patch: Partial<World>) => {
    setWorlds((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  };

  const deleteWorld = (id: string) => {
    if (worlds.length <= 1 || characters.some((c) => c.worldId === id)) return;
    const rest = worlds.filter((w) => w.id !== id);
    setWorlds(rest);
    setFacilities((prev) => prev.filter((f) => f.worldId !== id));
    setEvents((prev) => prev.filter((e) => e.worldId !== id));
    if (id === currentWorld.id) switchWorld(rest[0].id);
  };

  const applyTimelineToAllWorlds = (patch: Partial<WorldTimelineSettings>) => {
    setWorlds((prev) =>
      prev.map((w) => ({ ...w, timeline: { ...w.timeline, ...patch } }))
    );
  };

  const openAddCharacter = () => setAddCharacterOpen(true);

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[var(--paper)] shadow-[0_0_60px_rgba(143,65,229,0.14)]">
      <Header
        worlds={worlds}
        currentWorld={currentWorld}
        worldPopulation={worldPopulation}
        onSelectWorld={switchWorld}
        characters={worldCharacters}
        selectedId={selectedCharacterId}
        onSelectCharacter={handleSelectCharacter}
        favoriteCount={favoriteCount}
        favoriteMax={FAVORITE_SLOT_MAX}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenFavorites={() => setFavoritesOpen(true)}
        onOpenAddCharacter={openAddCharacter}
        minimal={tab !== "character"}
        showFavorites={tab === "timeline"}
        selectedEvent={selectedEvent}
        aiState={aiSettings.apiKey === "" ? "none" : aiSettings.enabled ? "on" : "off"}
        aiPending={aiStatus.pending}
        aiHasError={Boolean(aiStatus.lastError)}
        onOpenAiSettings={() => setSettingsOpen(true)}
      />

      {speed === 0 && (
        <div className="border-b border-[var(--line)] bg-[var(--wash)] px-4 py-1.5 text-center text-[11px] text-[var(--muted)]">
          {currentWorld.name}의 시간이 멈춰 있어요 · 관찰만 가능합니다
        </div>
      )}
      {speed > 1 && (
        <div className="border-b border-[var(--line)] bg-[var(--accent-soft)] px-4 py-1.5 text-center text-[11px] text-[var(--accent)]">
          {currentWorld.name}은(는) {speed}배속으로 시간이 흐르는 중 (UI 프로토타입)
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-24">
        {tab === "timeline" && (
          <TimelineTab
            logs={feedLogs}
            schedules={feedSchedules}
            characters={worldCharacters}
            filter={effectiveFilter}
            onFilterChange={handleTimelineFilterChange}
            onAddCharacter={openAddCharacter}
            logCounts={logCounts}
            favoriteCount={favoriteCount}
            favoriteMax={FAVORITE_SLOT_MAX}
            totalLogCount={logs.length}
            onToggleFavorite={toggleFavorite}
            onDeleteLog={(id) =>
              setLogs((prev) => prev.filter((l) => l.id !== id))
            }
            onAddSchedule={(item) =>
              setSchedules((prev) => [
                ...prev,
                { ...item, id: `sch-${Date.now()}` },
              ])
            }
            onUpdateSchedule={(id, patch) =>
              setSchedules((prev) =>
                prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
              )
            }
            onDeleteSchedule={(id) =>
              setSchedules((prev) => prev.filter((s) => s.id !== id))
            }
            ongoingEvents={ongoingWorldEvents}
            onOpenEvents={() => setTab("event")}
          />
        )}
        {tab === "sns" &&
          (selected ? (
            <SnsTab
              posts={worldPosts}
              characters={worldCharacters}
              selectedId={selectedCharacterId}
              onSelectCharacter={handleSelectCharacter}
              onUpdateSnsProfile={(characterId, sns) =>
                patchCharacter(characterId, { sns })
              }
              onUpdatePost={updatePost}
              onDeletePost={(id) =>
                setPosts((prev) => prev.filter((p) => p.id !== id))
              }
              onTogglePostFavorite={togglePostFavorite}
              autoPostEnabled={snsAutoPostEnabled}
              onToggleAutoPost={setSnsAutoPostEnabled}
            />
          ) : (
            <EmptyWorld world={currentWorld} onAdd={openAddCharacter} />
          ))}
        {tab === "character" &&
          (selected ? (
            <CharacterTab
              key={selected.id}
              character={selected}
              allCharacters={worldCharacters}
              worlds={worlds}
              worldPopulation={worldPopulation}
              onUpdate={updateSelectedCharacter}
              onPatch={(patch) => patchCharacter(selected.id, patch)}
              onUpdateRelationship={updateRelationship}
              onMoveWorld={(target) => moveCharacterToWorld(selected.id, target)}
            />
          ) : (
            <EmptyWorld world={currentWorld} onAdd={openAddCharacter} />
          ))}
        {tab === "event" && (
          <EventTab
            world={currentWorld}
            worlds={worlds}
            characters={characters}
            events={events}
            recordCounts={eventRecordCounts}
            onSave={saveEvent}
            onDelete={(id) => setEvents((prev) => prev.filter((e) => e.id !== id))}
            onCopy={copyEvent}
            onOpenCharacter={(id) => {
              handleSelectCharacter(id);
              setTab("character");
            }}
          />
        )}
        {tab === "world" && (
          <WorldTab
            worlds={worlds}
            currentWorld={currentWorld}
            characters={characters}
            facilities={facilities}
            onSelectWorld={switchWorld}
            onAddWorld={addWorld}
            onUpdateWorld={updateWorld}
            onDeleteWorld={deleteWorld}
            onApplyTimelineToAll={applyTimelineToAllWorlds}
            onOpenAddCharacter={openAddCharacter}
            onOpenCharacter={(id) => {
              handleSelectCharacter(id);
              setTab("character");
            }}
            onFulfillWish={fulfillWish}
            onAddFacility={(facility) =>
              setFacilities((prev) => [
                ...prev,
                { ...facility, id: `fac-${Date.now()}` },
              ])
            }
            onUpdateFacility={(id, patch) =>
              setFacilities((prev) =>
                prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
              )
            }
          />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />

      {settingsOpen && (
        <SettingsPanel
          worlds={worlds}
          characters={characters}
          aiSettings={aiSettings}
          onAiSettingsChange={setAiSettings}
          aiStatus={aiStatus}
          selectedCharacterName={selected?.name}
          onAiGenerateNow={generateNow}
          onApplyToAllWorlds={applyTimelineToAllWorlds}
          snsAutoPostEnabled={snsAutoPostEnabled}
          onSnsAutoPostChange={setSnsAutoPostEnabled}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {favoritesOpen && (
        <FavoritesVault
          logs={logs}
          characters={characters}
          favoriteMax={FAVORITE_SLOT_MAX}
          onToggleFavorite={toggleFavorite}
          onClose={() => setFavoritesOpen(false)}
        />
      )}

      {addCharacterOpen && (
        <AddCharacterModal
          worlds={worlds}
          worldPopulation={worldPopulation}
          defaultWorldId={currentWorld.id}
          onAdd={handleAddCharacter}
          onClose={() => setAddCharacterOpen(false)}
        />
      )}
    </div>
  );
}
