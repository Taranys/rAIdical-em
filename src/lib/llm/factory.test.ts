// US-2.02: Unit tests for LLM service factory
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./providers/openai", () => ({
  OpenAIService: vi.fn(function () {
    return { classify: vi.fn() };
  }),
}));

vi.mock("./providers/anthropic", () => ({
  AnthropicService: vi.fn(function () {
    return { classify: vi.fn() };
  }),
}));

vi.mock("./providers/google", () => ({
  GoogleService: vi.fn(function () {
    return { classify: vi.fn() };
  }),
}));

vi.mock("@/db/settings", () => ({
  getSetting: vi.fn(),
}));

import { createLLMService, createLLMServiceFromSettings } from "./factory";
import { OpenAIService } from "./providers/openai";
import { AnthropicService } from "./providers/anthropic";
import { GoogleService } from "./providers/google";
import { getSetting } from "@/db/settings";

const mockGetSetting = vi.mocked(getSetting);

describe("createLLMService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns OpenAIService for openai provider", () => {
    createLLMService({ provider: "openai", model: "gpt-4o", apiKey: "sk-test" });

    expect(OpenAIService).toHaveBeenCalledWith("sk-test", "gpt-4o");
  });

  it("returns AnthropicService for anthropic provider", () => {
    createLLMService({
      provider: "anthropic",
      model: "claude-sonnet-4-5-20250929",
      apiKey: "sk-ant-test",
    });

    expect(AnthropicService).toHaveBeenCalledWith("sk-ant-test", "claude-sonnet-4-5-20250929");
  });

  it("returns GoogleService for google provider", () => {
    createLLMService({
      provider: "google",
      model: "gemini-2.0-flash",
      apiKey: "AIza-test",
    });

    expect(GoogleService).toHaveBeenCalledWith("AIza-test", "gemini-2.0-flash");
  });

  it("throws on unknown provider", () => {
    expect(() =>
      createLLMService({
        provider: "unknown" as "openai",
        model: "model",
        apiKey: "key",
      }),
    ).toThrow("Unknown LLM provider: unknown");
  });
});

describe("createLLMServiceFromSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads settings and creates the correct service", () => {
    mockGetSetting.mockImplementation((key: string) => {
      if (key === "llm_provider") return "openai";
      if (key === "llm_model") return "gpt-4o";
      if (key === "llm_api_key") return "sk-test";
      return null;
    });

    createLLMServiceFromSettings();

    expect(mockGetSetting).toHaveBeenCalledWith("llm_provider");
    expect(mockGetSetting).toHaveBeenCalledWith("llm_model");
    expect(mockGetSetting).toHaveBeenCalledWith("llm_api_key");
    expect(OpenAIService).toHaveBeenCalledWith("sk-test", "gpt-4o");
  });

  it("throws when provider is not configured", () => {
    mockGetSetting.mockReturnValue(null);

    expect(() => createLLMServiceFromSettings()).toThrow("LLM provider not configured");
  });

  it("throws when API key is missing", () => {
    mockGetSetting.mockImplementation((key: string) => {
      if (key === "llm_provider") return "openai";
      if (key === "llm_model") return "gpt-4o";
      return null;
    });

    expect(() => createLLMServiceFromSettings()).toThrow("LLM provider not configured");
  });
});
