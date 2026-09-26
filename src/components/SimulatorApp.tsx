"use client";

import { useEffect, useMemo, useState } from "react";
import AddCharacterModal from "@/components/AddCharacterModal";
import BottomNav from "@/components/BottomNav";
import CharacterTab from "@/components/CharacterTab";
import FacilityTab from "@/components/FacilityTab";
import FavoritesVault from "@/components/FavoritesVault";
import Header from "@/components/Header";
import OfflineLogSettingsPanel from "@/components/OfflineLogSettingsPanel";
import SnsTab from "@/components/SnsTab";
import TimelineTab from "@/components/TimelineTab";
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
} from "@/data/dummy";
import { generateLogFromCurrentProfile } from "@/lib/generateLogFromProfile";
import { DEFAULT_OFFLINE_LOG_FREQUENCY } from "@/data/offlineLogSettings";
import {
  loadCharacterProfiles,
  loadOfflineLogFrequency,
  loadSelectedCharacterId,
  saveCharacterProfiles,
  saveOfflineLogFrequency,
  saveSelectedCharacterId,
} from "@/lib/persistence";
import type {
  ActionLog,
  CharacterProfile,
  Facility,
  OfflineLogFrequency,
  ScheduleItem,
  SpeedMode,
  SnsComment,
  SnsPost,
  TabId,
} from "@/types";

export default function SimulatorApp() {
  const [tab, setTab] = useState<TabId>("timeline");
  const [selectedId, setSelectedId] = useState(initialCharacters[0].id);
  const [speed, setSpeed] = useState<SpeedMode>(1);
  const [offlineFrequency, setOfflineFrequency] =
    useState<OfflineLogFrequency>(DEFAULT_OFFLINE_LOG_FREQUENCY);
  const [offlineSettingsOpen, setOfflineSettingsOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [addCharacterOpen, setAddCharacterOpen] = useState(false);
  const [characters, setCharacters] =
    useState<CharacterProfile[]>(initialCharacters);
  const [logs, setLogs] = useState<ActionLog[]>(initialLogs);
  const [schedules, setSchedules] =
    useState<ScheduleItem[]>(initialSchedules);
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities);
  const [posts, setPosts] = useState<SnsPost[]>(initialSnsPosts);
  /** LocalStorage 복원 완료 전엔 기본값으로 덮어쓰지 않음 */
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const profiles = loadCharacterProfiles(initialCharacters);
    const frequency = loadOfflineLogFrequency();
    const selected = loadSelectedCharacterId(
      profiles,
      profiles[0]?.id ?? initialCharacters[0].id
    );
    setCharacters(profiles);
    setOfflineFrequency(frequency);
    setSelectedId(selected);
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    saveOfflineLogFrequency(offlineFrequency);
  }, [offlineFrequency, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    saveCharacterProfiles(characters);
  }, [characters, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    saveSelectedCharacterId(selectedId);
  }, [selectedId, storageReady]);

  const handleOfflineFrequencyChange = (value: OfflineLogFrequency) => {
    setOfflineFrequency(value);
    // 즉시 저장 (effect와 중복이어도 안전)
    saveOfflineLogFrequency(value);
  };

  const selected =
    characters.find((c) => c.id === selectedId) ?? characters[0];

  const favoriteCount = useMemo(
    () => logs.filter((l) => l.isFavorite).length,
    [logs]
  );

  const characterLogs = useMemo(
    () =>
      logs
        .filter((l) => l.characterId === selectedId)
        .sort((a, b) => b.time.localeCompare(a.time)),
    [logs, selectedId]
  );

  const characterSchedules = useMemo(
    () =>
      schedules
        .filter((s) => s.characterId === selectedId)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [schedules, selectedId]
  );

  const toggleFavorite = (id: string) => {
    setLogs((prev) =>
      prev.map((log) => {
        if (log.id !== id) return log;
        if (log.isFavorite) return { ...log, isFavorite: false };
        const count = prev.filter((l) => l.isFavorite).length;
        if (count >= FAVORITE_SLOT_MAX) return log;
        return { ...log, isFavorite: true };
      })
    );
  };

  const updateCharacter = (patch: Partial<CharacterProfile>) => {
    const keys = Object.keys(patch);
    const vitalsOnly = keys.length === 1 && keys[0] === "vitals";
    setCharacters((prev) => {
      const next = prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              ...patch,
              ...(vitalsOnly
                ? {}
                : { profileUpdatedAt: new Date().toISOString() }),
            }
          : c
      );
      if (storageReady) saveCharacterProfiles(next);
      return next;
    });
  };

  /** 최신 currentProfile만으로 로그 1건 생성 (과거 로그 미참조) */
  const generateTestLogFromProfile = () => {
    const profile =
      characters.find((c) => c.id === selectedId) ?? characters[0];
    if (!profile) return;
    const withStamp: CharacterProfile = {
      ...profile,
      profileUpdatedAt: profile.profileUpdatedAt ?? new Date().toISOString(),
    };
    const log = generateLogFromCurrentProfile(withStamp);
    setLogs((prev) => [log, ...prev]);
    setCharacters((prev) => {
      const next = prev.map((c) =>
        c.id === profile.id
          ? {
              ...c,
              currentLocation: log.location,
              currentAction: `최신 프로필로 행동 중 · "${log.innerThought.slice(0, 24)}${log.innerThought.length > 24 ? "…" : ""}"`,
              profileUpdatedAt: withStamp.profileUpdatedAt,
            }
          : c
      );
      if (storageReady) saveCharacterProfiles(next);
      return next;
    });
    setTab("timeline");
  };

  const handleAddCharacter = (name: string) => {
    const newbie = createBlankCharacter(name, characters);
    setCharacters((prev) => {
      const next = withMutualRelationships([...prev, newbie], newbie);
      if (storageReady) saveCharacterProfiles(next);
      return next;
    });
    setSelectedId(newbie.id);
    setTab("character");
  };

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[var(--paper)] shadow-[0_0_60px_rgba(26,43,60,0.12)]">
      <Header
        characters={characters}
        selectedId={selectedId}
        onSelectCharacter={setSelectedId}
        speed={speed}
        onSpeedChange={setSpeed}
        favoriteCount={favoriteCount}
        favoriteMax={FAVORITE_SLOT_MAX}
        offlineFrequency={offlineFrequency}
        onOpenOfflineSettings={() => setOfflineSettingsOpen(true)}
        onOpenFavorites={() => setFavoritesOpen(true)}
        onOpenAddCharacter={() => setAddCharacterOpen(true)}
      />

      {speed === 0 && (
        <div className="border-b border-[var(--line)] bg-[var(--wash)] px-4 py-1.5 text-center text-[11px] text-[var(--muted)]">
          시뮬레이션 일시정지 중 · 관찰만 가능합니다
        </div>
      )}
      {speed > 1 && (
        <div className="border-b border-[var(--line)] bg-[var(--accent-soft)] px-4 py-1.5 text-center text-[11px] text-[var(--accent)]">
          {speed}배속으로 시간이 흐르는 중 (UI 프로토타입)
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-24">
        {tab === "timeline" && (
          <TimelineTab
            logs={characterLogs}
            schedules={characterSchedules}
            favoriteCount={favoriteCount}
            favoriteMax={FAVORITE_SLOT_MAX}
            onToggleFavorite={toggleFavorite}
            onUpdateLog={(id, patch) =>
              setLogs((prev) =>
                prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
              )
            }
            onDeleteLog={(id) =>
              setLogs((prev) => prev.filter((l) => l.id !== id))
            }
            onAddSchedule={(item) =>
              setSchedules((prev) => [
                ...prev,
                {
                  ...item,
                  id: `sch-${Date.now()}`,
                  characterId: selectedId,
                },
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
          />
        )}
        {tab === "sns" && (
          <SnsTab
            posts={posts}
            characters={characters}
            activeCharacterId={selectedId}
            onUpdatePost={(id, patch) =>
              setPosts((prev) =>
                prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
              )
            }
            onAddPost={(post) => setPosts((prev) => [post, ...prev])}
            onDeletePost={(id) =>
              setPosts((prev) => prev.filter((p) => p.id !== id))
            }
            onAddComment={(postId, comment: SnsComment) =>
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === postId
                    ? { ...p, comments: [...p.comments, comment] }
                    : p
                )
              )
            }
            onUpdateComment={(postId, commentId, patch) =>
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === postId
                    ? {
                        ...p,
                        comments: p.comments.map((c) =>
                          c.id === commentId ? { ...c, ...patch } : c
                        ),
                      }
                    : p
                )
              )
            }
            onDeleteComment={(postId, commentId) =>
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === postId
                    ? {
                        ...p,
                        comments: p.comments.filter((c) => c.id !== commentId),
                      }
                    : p
                )
              )
            }
          />
        )}
        {tab === "character" && (
          <CharacterTab
            character={selected}
            allCharacters={characters}
            onUpdate={updateCharacter}
            onGenerateTestLog={generateTestLogFromProfile}
          />
        )}
        {tab === "facility" && (
          <FacilityTab
            facilities={facilities}
            wishHint={selected.wish}
            onAdd={(facility) =>
              setFacilities((prev) => [
                ...prev,
                { ...facility, id: `fac-${Date.now()}` },
              ])
            }
            onUpdate={(id, patch) =>
              setFacilities((prev) =>
                prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
              )
            }
          />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />

      {offlineSettingsOpen && (
        <OfflineLogSettingsPanel
          value={offlineFrequency}
          characterCount={characters.length}
          onChange={handleOfflineFrequencyChange}
          onClose={() => setOfflineSettingsOpen(false)}
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
          onAdd={handleAddCharacter}
          onClose={() => setAddCharacterOpen(false)}
        />
      )}
    </div>
  );
}
