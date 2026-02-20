// US-2.02: LLM service factory
import { getSetting } from "@/db/settings";
import type { LlmConfig } from "@/lib/llm-providers";
import type { LLMService } from "./types";
import { OpenAIService } from "./providers/openai";
import { AnthropicService } from "./providers/anthropic";
import { GoogleService } from "./providers/google";

export function createLLMService(config: LlmConfig): LLMService {
  switch (config.provider) {
    case "openai":
      return new OpenAIService(config.apiKey, config.model);
    case "anthropic":
      return new AnthropicService(config.apiKey, config.model);
    case "google":
      return new GoogleService(config.apiKey, config.model);
    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}

export function createLLMServiceFromSettings(): LLMService {
  const provider = getSetting("llm_provider");
  const model = getSetting("llm_model");
  const apiKey = getSetting("llm_api_key");

  if (!provider || !model || !apiKey) {
    throw new Error("LLM provider not configured");
  }

  return createLLMService({
    provider: provider as LlmConfig["provider"],
    model,
    apiKey,
  });
}
