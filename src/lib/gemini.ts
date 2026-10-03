/**
 * Gemini API (Google AI Studio 키) 브라우저 클라이언트.
 * 키는 유저 브라우저에만 저장되고, 요청도 브라우저에서 Google로 직접 보낸다.
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

export const GEMINI_MODEL_PRESETS = [
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash (기본 · 글 품질 우선)" },
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite (빠르고 저렴)" },
];

/** 연속 요청 사이 최소 간격. 무료 등급의 분당 한도에 덜 걸리게 */
const MIN_REQUEST_GAP_MS = 2500;

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

function describeHttpError(status: number, apiMessage: string) {
  if (status === 400 && /api key/i.test(apiMessage)) return "API 키가 올바르지 않아요.";
  if (status === 401 || status === 403) return "API 키가 거부됐어요. 키와 권한을 확인해 주세요.";
  if (status === 404) return "선택한 모델을 찾을 수 없어요. 다른 모델을 골라 주세요.";
  if (status === 429) return "요청 한도를 초과했어요. 잠시 후 다시 시도하거나 생성 빈도를 줄여 주세요.";
  if (status >= 500) return "Gemini 서버가 잠시 응답하지 않아요. 잠시 후 다시 시도할게요.";
  return apiMessage || `요청이 실패했어요 (HTTP ${status}).`;
}

async function request<T>(path: string, apiKey: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
        ...init?.headers,
      },
    });
  } catch {
    throw new GeminiError("네트워크 오류로 Gemini에 연결하지 못했어요.");
  }
  if (!res.ok) {
    let apiMessage = "";
    try {
      apiMessage = ((await res.json()) as { error?: { message?: string } }).error?.message ?? "";
    } catch {
      /* 본문이 JSON이 아니면 상태 코드로만 설명 */
    }
    throw new GeminiError(describeHttpError(res.status, apiMessage), res.status);
  }
  return (await res.json()) as T;
}

/* 요청을 한 줄로 세워 차례대로, 최소 간격을 두고 보낸다 */
let queue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = async () => {
    const wait = lastRequestAt + MIN_REQUEST_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
    return task();
  };
  const next = queue.then(run, run);
  queue = next.catch(() => undefined);
  return next;
}

/** Gemini responseSchema (OpenAPI 부분 집합) */
export interface GeminiSchema {
  type: "OBJECT" | "ARRAY" | "STRING" | "INTEGER" | "NUMBER" | "BOOLEAN";
  description?: string;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
  items?: GeminiSchema;
}

interface GenerateResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

/** 시스템 지시 + 유저 프롬프트로 스키마에 맞는 JSON을 받는다 */
export function generateJson<T>(
  config: GeminiConfig,
  { system, prompt, schema }: { system: string; prompt: string; schema: GeminiSchema }
): Promise<T> {
  return enqueue(async () => {
    const data = await request<GenerateResponse>(
      `models/${encodeURIComponent(config.model)}:generateContent`,
      config.apiKey,
      {
        method: "POST",
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
            // Gemini 3 계열은 temperature 대신 생각 수준으로 조절한다
            ...(config.model.startsWith("gemini-3") && {
              thinkingConfig: { thinkingLevel: "low" },
            }),
          },
        }),
      }
    );
    if (data.promptFeedback?.blockReason) {
      throw new GeminiError("안전 필터에 걸려 생성하지 못했어요. 프로필이나 세계관 표현을 확인해 주세요.");
    }
    const text = data.candidates?.[0]?.content?.parts
      ?.filter((p) => !p.thought)
      .map((p) => p.text ?? "")
      .join("");
    if (!text) throw new GeminiError("Gemini가 빈 응답을 보냈어요.");
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new GeminiError("Gemini 응답을 해석하지 못했어요.");
    }
  });
}

/** 키·모델이 쓸 수 있는지 확인하고 모델 표시 이름을 돌려준다 */
export async function testGeminiConnection(config: GeminiConfig): Promise<string> {
  const model = await request<{ displayName?: string }>(
    `models/${encodeURIComponent(config.model)}`,
    config.apiKey
  );
  return model.displayName ?? config.model;
}

/** 이 키로 글 생성에 쓸 수 있는 Gemini 모델 목록 */
export async function listGeminiModels(apiKey: string): Promise<{ id: string; label: string }[]> {
  const data = await request<{
    models?: { name: string; displayName?: string; supportedGenerationMethods?: string[] }[];
  }>("models?pageSize=200", apiKey);
  return (data.models ?? [])
    .filter(
      (m) =>
        m.supportedGenerationMethods?.includes("generateContent") &&
        /^models\/gemini-/.test(m.name) &&
        !/(tts|image|live|embedding|transcribe|audio)/.test(m.name)
    )
    .map((m) => {
      const id = m.name.replace(/^models\//, "");
      return { id, label: m.displayName ? `${m.displayName} (${id})` : id };
    });
}
