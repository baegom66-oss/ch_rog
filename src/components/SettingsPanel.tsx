"use client";

import { Database, Gauge, Globe, Leaf, Sparkles } from "lucide-react";
import AiSettingsSection, { type AiGenerateKind } from "@/components/AiSettingsSection";
import Modal from "@/components/Modal";
import {
  OfflineFrequencyOptions,
  SpeedSelector,
} from "@/components/TimelineSettingsFields";
import { getOfflineLogOption } from "@/data/offlineLogSettings";
import { charactersInWorld } from "@/data/worlds";
import { SNS_AUTO_POSTS_PER_DAY } from "@/lib/snsAutoPost";
import type {
  AiSettings,
  AiStatus,
  CharacterProfile,
  World,
  WorldTimelineSettings,
} from "@/types";

interface SettingsPanelProps {
  worlds: World[];
  characters: CharacterProfile[];
  aiSettings: AiSettings;
  onAiSettingsChange: (next: AiSettings) => void;
  aiStatus: AiStatus;
  selectedCharacterName?: string;
  onAiGenerateNow: (kind: AiGenerateKind) => Promise<string | undefined>;
  /** 모든 세계에 같은 타임라인 설정을 적용 */
  onApplyToAllWorlds: (patch: Partial<WorldTimelineSettings>) => void;
  snsAutoPostEnabled: boolean;
  onSnsAutoPostChange: (enabled: boolean) => void;
  onClose: () => void;
}

/** 모든 세계가 같은 값이면 그 값, 하나라도 다르면 null */
function sharedValue<K extends keyof WorldTimelineSettings>(
  worlds: World[],
  key: K
): WorldTimelineSettings[K] | null {
  const first = worlds[0]?.timeline[key];
  return worlds.every((w) => w.timeline[key] === first) ? first : null;
}

function MixedHint() {
  return (
    <p className="mt-1.5 text-[10.5px] text-[var(--accent)]">
      지금은 세계마다 다르게 설정돼 있어요. 고르면 모든 세계에 같은 값이 적용됩니다.
    </p>
  );
}

export default function SettingsPanel({
  worlds,
  characters,
  aiSettings,
  onAiSettingsChange,
  aiStatus,
  selectedCharacterName,
  onAiGenerateNow,
  onApplyToAllWorlds,
  snsAutoPostEnabled,
  onSnsAutoPostChange,
  onClose,
}: SettingsPanelProps) {
  const speed = sharedValue(worlds, "speed");
  const offlineFrequency = sharedValue(worlds, "offlineFrequency");
  const estimatedDaily = worlds.reduce(
    (sum, w) =>
      sum +
      getOfflineLogOption(w.timeline.offlineFrequency).logsPerDay *
        charactersInWorld(characters, w.id).length,
    0
  );

  return (
    <Modal title="설정" onClose={onClose}>
      <div className="space-y-6 px-4 py-4">
        <AiSettingsSection
          settings={aiSettings}
          onChange={onAiSettingsChange}
          status={aiStatus}
          selectedCharacterName={selectedCharacterName}
          onGenerateNow={onAiGenerateNow}
        />

        <div className="flex gap-2 rounded-xl border border-dashed border-[var(--accent)]/35 bg-[var(--accent-soft)]/50 px-3 py-2.5">
          <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
          <p className="text-[11px] leading-5 text-[var(--ink)]/85">
            여기서 바꾸는 배속·오프라인 생성은 <b>모든 세계({worlds.length}개)에 한 번에</b>{" "}
            적용돼요. 세계마다 다르게 하려면 세계 탭에서 각각 설정하세요.
          </p>
        </div>

        <section>
          <div className="mb-2.5">
            <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink)]">
              <Gauge className="h-4 w-4 text-[var(--accent)]" />
              시뮬레이션 배속
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">
              접속 중 캐릭터들의 시간이 흐르는 속도
            </p>
          </div>
          <SpeedSelector value={speed} onChange={(s) => onApplyToAllWorlds({ speed: s })} />
          {speed === null && <MixedHint />}
        </section>

        <section className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink)]">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              SNS 자동 게시
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">
              캐릭터당 하루 {SNS_AUTO_POSTS_PER_DAY.min}~
              {SNS_AUTO_POSTS_PER_DAY.max}개 · 댓글·공유는 관계와 사회성에 따라 · 일시정지된
              세계에서는 생성 안 함
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={snsAutoPostEnabled}
            aria-label="SNS 자동 게시"
            onClick={() => onSnsAutoPostChange(!snsAutoPostEnabled)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              snsAutoPostEnabled ? "bg-[var(--accent)]" : "bg-[var(--line)]"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                snsAutoPostEnabled ? "left-[1.375rem]" : "left-0.5"
              }`}
            />
          </button>
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink)]">
              <Leaf className="h-4 w-4 text-[var(--accent)]" />
              오프라인 타임라인 생성
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">
              미접속 중 쌓이는 행동 로그 양을 조절합니다
            </p>
            {offlineFrequency === null && <MixedHint />}
          </div>

          <OfflineFrequencyOptions
            name="offline-log-frequency-all"
            value={offlineFrequency}
            onChange={(v) => onApplyToAllWorlds({ offlineFrequency: v })}
          />

          <div className="rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--ink)]">
              <Database className="h-3.5 w-3.5 text-[var(--accent)]" />
              예상 일일 저장량
            </div>
            <p className="mt-1.5 text-[12.5px] leading-5 text-[var(--ink)]/85">
              {estimatedDaily === 0 ? (
                <>미접속 시 로그 0건 · 오프라인 구간에는 DB에 쌓이지 않습니다.</>
              ) : (
                <>
                  전체 세계 캐릭터 {characters.length}명 기준{" "}
                  <strong className="font-semibold text-[var(--accent)]">
                    하루 약 {estimatedDaily}건
                  </strong>
                  의 오프라인 로그가 생성될 수 있습니다.
                </>
              )}
            </p>
          </div>
        </section>
      </div>
    </Modal>
  );
}
