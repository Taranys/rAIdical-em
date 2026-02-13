// US-2.01: LLM provider definitions and model lists

export type LlmProvider = "openai" | "anthropic" | "google";

export interface LlmModel {
  id: string;
  label: string;
}

export interface LlmProviderConfig {
  label: string;
  models: LlmModel[];
  placeholder: string;
}

export interface LlmConfig {
  provider: LlmProvider;
  model: string;
  apiKey: string;
}

export const LLM_PROVIDERS: Record<LlmProvider, LlmProviderConfig> = {
  openai: {
    label: "OpenAI",
    placeholder: "sk-...",
    models: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
      { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { id: "o1", label: "o1" },
      { id: "o1-mini", label: "o1 Mini" },
      { id: "o3-mini", label: "o3 Mini" },
    ],
  },
  anthropic: {
    label: "Anthropic (Claude)",
    placeholder: "sk-ant-...",
    models: [
      { id: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
      { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ],
  },
  google: {
    label: "Google (Gemini)",
    placeholder: "AIza...",
    models: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    ],
  },
};

export const PROVIDER_IDS = Object.keys(LLM_PROVIDERS) as LlmProvider[];

export function isValidProvider(value: unknown): value is LlmProvider {
  return typeof value === "string" && value in LLM_PROVIDERS;
}

export function isValidModel(provider: LlmProvider, modelId: string): boolean {
  return LLM_PROVIDERS[provider].models.some((m) => m.id === modelId);
}
