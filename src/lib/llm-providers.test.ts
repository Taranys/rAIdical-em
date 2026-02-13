// US-2.01: Unit tests for LLM provider definitions
import { describe, it, expect } from "vitest";
import {
  LLM_PROVIDERS,
  type LlmProvider,
  type LlmProviderConfig,
} from "./llm-providers";

describe("LLM_PROVIDERS", () => {
  const providerIds: LlmProvider[] = ["openai", "anthropic", "google"];

  it("defines all three supported providers", () => {
    expect(Object.keys(LLM_PROVIDERS)).toEqual(
      expect.arrayContaining(providerIds),
    );
    expect(Object.keys(LLM_PROVIDERS)).toHaveLength(3);
  });

  it.each(providerIds)("%s has a non-empty label", (id) => {
    const provider: LlmProviderConfig = LLM_PROVIDERS[id];
    expect(provider.label).toBeTruthy();
    expect(typeof provider.label).toBe("string");
  });

  it.each(providerIds)("%s has at least one model", (id) => {
    const provider: LlmProviderConfig = LLM_PROVIDERS[id];
    expect(provider.models.length).toBeGreaterThanOrEqual(1);
  });

  it.each(providerIds)("%s models have id and label", (id) => {
    const provider: LlmProviderConfig = LLM_PROVIDERS[id];
    for (const model of provider.models) {
      expect(model.id).toBeTruthy();
      expect(model.label).toBeTruthy();
    }
  });

  it.each(providerIds)("%s has a placeholder for the API key input", (id) => {
    const provider: LlmProviderConfig = LLM_PROVIDERS[id];
    expect(provider.placeholder).toBeTruthy();
    expect(typeof provider.placeholder).toBe("string");
  });

  it("has unique model ids across all providers", () => {
    const allModelIds = Object.values(LLM_PROVIDERS).flatMap((p) =>
      p.models.map((m) => m.id),
    );
    const unique = new Set(allModelIds);
    expect(unique.size).toBe(allModelIds.length);
  });
});
