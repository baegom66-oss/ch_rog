"use client";

import {
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import {
  GEMINI_MODEL_PRESETS,
  listGeminiModels,
  testGeminiConnection,
} from "@/lib/gemini";
import { MAX_CATCH_UP } from "@/lib/timelineAuto";
import type { AiSettings, AiStatus } from "@/types";

const AI_STUDIO_KEY_URL = "https://aistudio.google.com/apikey";

export type AiGenerateKind = "timeline" | "sns";

interface AiSettingsSectionProps {
  settings: AiSettings;
  onChange: (next: AiSettings) => void;
  status: AiStatus;
  /** 지금 생성해 보기 대상 (현재 선택된 캐릭터) */
  selectedCharacterName?: string;
  /** 실패하면 에러 메시지를 돌려준다 */
  onGenerateNow: (kind: AiGenerateKind) => Promise<string | undefined>;
}

type Feedback = { tone: "ok" | "error"; text: string } | null;

function formatClock(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <p
      className={`text-[11px] leading-5 ${
        feedback.tone === "ok" ? "text-emerald-600" : "text-red-600"
      }`}
    >
      {feedback.text}
    </p>
  );
}

export default function AiSettingsSection({
  settings,
  onChange,
  status,
  selectedCharacterName,
  onGenerateNow,
}: AiSettingsSectionProps) {
  const [draftKey, setDraftKey] = useState(settings.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState<Feedback>(null);
  const [models, setModels] = useState(GEMINI_MODEL_PRESETS);
  const [loadingModels, setLoadingModels] = useState(false);
  const [generating, setGenerating] = useState<AiGenerateKind | null>(null);
  const [generateFeedback, setGenerateFeedback] = useState<Feedback>(null);

  const hasKey = settings.apiKey !== "";
  const active = hasKey && settings.enabled;
  const trimmedDraft = draftKey.trim();
  const modelOptions = models.some((m) => m.id === settings.model)
    ? models
    : [{ id: settings.model, label: settings.model }, ...models];

  const runTest = async (apiKey: string, model = settings.model) => {
    setTesting(true);
    setKeyFeedback(null);
    try {
      const name = await testGeminiConnection({ apiKey, model });
      setKeyFeedback({ tone: "ok", text: `연결 성공 · ${name} 모델을 쓸 수 있어요.` });
    } catch (e) {
      setKeyFeedback({ tone: "error", text: e instanceof Error ? e.message : "연결에 실패했어요." });
    } finally {
      setTesting(false);
    }
  };

  const saveKey = () => {
    if (!trimmedDraft) return;
    onChange({ ...settings, apiKey: trimmedDraft, enabled: true });
    void runTest(trimmedDraft);
  };

  const deleteKey = () => {
    if (!window.confirm("이 브라우저에 저장된 Gemini API 키를 지울까요?")) return;
    onChange({ ...settings, apiKey: "" });
    setDraftKey("");
    setKeyFeedback({ tone: "ok", text: "키를 지웠어요. AI 대신 기본 문장으로 기록돼요." });
  };

  const loadModels = async () => {
    if (!hasKey) return;
    setLoadingModels(true);
    try {
      const fetched = await listGeminiModels(settings.apiKey);
      const presetIds = new Set(GEMINI_MODEL_PRESETS.map((m) => m.id));
      setModels([...GEMINI_MODEL_PRESETS, ...fetched.filter((m) => !presetIds.has(m.id))]);
      setKeyFeedback({ tone: "ok", text: `이 키로 쓸 수 있는 모델 ${fetched.length}개를 불러왔어요.` });
    } catch (e) {
      setKeyFeedback({ tone: "error", text: e instanceof Error ? e.message : "모델 목록을 불러오지 못했어요." });
    } finally {
      setLoadingModels(false);
    }
  };

  const generateNow = async (kind: AiGenerateKind) => {
    setGenerating(kind);
    setGenerateFeedback(null);
    const error = await onGenerateNow(kind);
    setGenerating(null);
    setGenerateFeedback(
      error
        ? { tone: "error", text: error }
        : {
            tone: "ok",
            text: `${selectedCharacterName}의 ${kind === "timeline" ? "타임라인" : "SNS 글"}을 새로 작성했어요.`,
          }
    );
  };

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--line)] p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink)]">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            AI 연동 (Gemini)
          </h3>
          <p className="mt-0.5 text-[11px] leading-5 text-[var(--muted)]">
            타임라인과 SNS 글을 캐릭터 성향·관계·세계관·이벤트에 맞춰 Gemini가 작성해요.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${
            active
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "bg-[var(--wash)] text-[var(--muted)]"
          }`}
        >
          {active ? "사용 중" : hasKey ? "꺼짐" : "키 없음"}
        </span>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="gemini-api-key"
          className="flex items-center gap-1 text-[11px] font-medium text-[var(--ink)]"
        >
          <KeyRound className="h-3.5 w-3.5 text-[var(--accent)]" />
          Gemini API Key
        </label>
        <div className="flex gap-1.5">
          <div className="relative min-w-0 flex-1">
            <input
              id="gemini-api-key"
              type={showKey ? "text" : "password"}
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveKey()}
              placeholder="AIza…로 시작하는 키를 붙여 넣으세요"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-xl border border-[var(--line)] bg-white py-2 pl-3 pr-9 font-mono text-xs text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--muted)] hover:text-[var(--ink)]"
              aria-label={showKey ? "키 숨기기" : "키 보기"}
            >
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          <button
            type="button"
            onClick={saveKey}
            disabled={!trimmedDraft || trimmedDraft === settings.apiKey}
            className="shrink-0 rounded-xl bg-[var(--accent)] px-3 text-xs font-medium text-white disabled:opacity-35"
          >
            저장
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <a
            href={AI_STUDIO_KEY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-[11px] text-[var(--accent)] underline-offset-2 hover:underline"
          >
            Google AI Studio에서 키 발급받기
            <ExternalLink className="h-3 w-3" />
          </a>
          {hasKey && (
            <>
              <button
                type="button"
                onClick={() => void runTest(settings.apiKey)}
                disabled={testing}
                className="inline-flex items-center gap-1 text-[11px] text-[var(--ink)] hover:text-[var(--accent)] disabled:opacity-50"
              >
                {testing && <Loader2 className="h-3 w-3 animate-spin" />}
                연결 테스트
              </button>
              <button
                type="button"
                onClick={deleteKey}
                className="text-[11px] text-red-500 hover:text-red-600"
              >
                키 삭제
              </button>
            </>
          )}
        </div>
        <FeedbackLine feedback={keyFeedback} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="gemini-model" className="text-[11px] font-medium text-[var(--ink)]">
            모델
          </label>
          {hasKey && (
            <button
              type="button"
              onClick={() => void loadModels()}
              disabled={loadingModels}
              className="inline-flex items-center gap-1 text-[10.5px] text-[var(--muted)] hover:text-[var(--accent)] disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loadingModels ? "animate-spin" : ""}`} />
              사용 가능한 모델 불러오기
            </button>
          )}
        </div>
        <select
          id="gemini-model"
          value={settings.model}
          onChange={(e) => onChange({ ...settings, model: e.target.value })}
          className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--accent)]"
        >
          {modelOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-[var(--ink)]">AI로 기록 작성</p>
          <p className="mt-0.5 text-[10.5px] leading-4 text-[var(--muted)]">
            타임라인은 세계별 오프라인 생성 빈도만큼, SNS는 자동 게시가 켜져 있을 때 작성해요.
            오랜만에 접속하면 캐릭터당 최근 {MAX_CATCH_UP}건까지만 따라잡아요.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={active}
          aria-label="AI로 기록 작성"
          disabled={!hasKey}
          onClick={() => onChange({ ...settings, enabled: !settings.enabled })}
          className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40 ${
            active ? "bg-[var(--point)]" : "bg-[var(--line)]"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full shadow transition-all ${
              active ? "left-[1.375rem] bg-[var(--main)]" : "left-0.5 bg-white"
            }`}
          />
        </button>
      </div>

      {active && (
        <div className="space-y-2 rounded-xl bg-[var(--wash)] px-3 py-2.5">
          <div className="space-y-0.5 text-[11px] leading-5 text-[var(--ink)]/85">
            {status.pending > 0 && (
              <p className="flex items-center gap-1 text-[var(--accent)]">
                <Loader2 className="h-3 w-3 animate-spin" />
                작성 중 {status.pending}건
              </p>
            )}
            <p>
              최근 성공:{" "}
              {status.lastSuccessAt ? formatClock(status.lastSuccessAt) : "아직 없음"}
            </p>
            {status.lastError && (
              <p className="text-red-600">
                최근 실패 ({formatClock(status.lastError.at)}): {status.lastError.message}
                <span className="block text-[10.5px] text-[var(--muted)]">
                  실패한 기록은 기본 문장으로 대신 남기거나 건너뛰어요.
                </span>
              </p>
            )}
          </div>
          <div className="flex gap-1.5">
            {(["timeline", "sns"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => void generateNow(kind)}
                disabled={!selectedCharacterName || generating !== null}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--paper)] py-1.5 text-[11px] font-medium text-[var(--ink)] hover:border-[var(--accent)] disabled:opacity-45"
              >
                {generating === kind && <Loader2 className="h-3 w-3 animate-spin" />}
                {kind === "timeline" ? "타임라인 1건" : "SNS 글 1건"} 지금 작성
              </button>
            ))}
          </div>
          <p className="text-[10.5px] text-[var(--muted)]">
            {selectedCharacterName
              ? `대상: ${selectedCharacterName} (상단에서 선택된 캐릭터)`
              : "이 세계에 캐릭터가 없어요."}
          </p>
          <FeedbackLine feedback={generateFeedback} />
        </div>
      )}

      <div className="flex gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2.5">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
        <ul className="space-y-0.5 text-[10.5px] leading-[1.55] text-[var(--ink)]/80">
          <li>키는 이 브라우저(LocalStorage)에만 저장되고, 요청은 브라우저에서 Google로 직접 보내요.</li>
          <li>공용 PC에서는 사용 후 꼭 키를 삭제하세요.</li>
          <li>무료 등급은 분당·일일 요청 한도가 있어요. 캐릭터가 많으면 생성 빈도를 낮춰 주세요.</li>
        </ul>
      </div>
    </section>
  );
}
