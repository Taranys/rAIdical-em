// US-2.02: Unit tests for OpenAI LLM provider
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();

vi.mock("openai", () => {
  const MockOpenAI = vi.fn(function () {
    return { chat: { completions: { create: mockCreate } } };
  });
  return { default: MockOpenAI };
});

vi.mock("../retry", () => ({
  withRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

import OpenAI from "openai";
import { OpenAIService } from "./openai";
import { LLMAuthError, LLMRateLimitError, LLMNetworkError, LLMError } from "../types";

describe("OpenAIService", () => {
  let service: OpenAIService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OpenAIService("sk-test", "gpt-4o");
  });

  it("creates OpenAI client with the provided API key", () => {
    expect(OpenAI).toHaveBeenCalledWith({ apiKey: "sk-test" });
  });

  it("calls chat.completions.create with the correct parameters", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "response" } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    await service.classify("test prompt");

    expect(mockCreate).toHaveBeenCalledWith({
      model: "gpt-4o",
      messages: [{ role: "user", content: "test prompt" }],
    });
  });

  it("returns content and usage from the response", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "classified result" } }],
      usage: { prompt_tokens: 10, completion_tokens: 20 },
    });

    const result = await service.classify("test prompt");

    expect(result.content).toBe("classified result");
    expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 20 });
  });

  it("handles null content gracefully", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
      usage: null,
    });

    const result = await service.classify("test prompt");

    expect(result.content).toBe("");
    expect(result.usage).toBeUndefined();
  });

  it("maps AuthenticationError to LLMAuthError", async () => {
    const sdkError = new Error("Invalid API key");
    (sdkError as Record<string, unknown>).status = 401;
    mockCreate.mockRejectedValue(sdkError);

    await expect(service.classify("test")).rejects.toThrow(LLMAuthError);
  });

  it("maps RateLimitError to LLMRateLimitError", async () => {
    const sdkError = new Error("Rate limit exceeded");
    (sdkError as Record<string, unknown>).status = 429;
    mockCreate.mockRejectedValue(sdkError);

    await expect(service.classify("test")).rejects.toThrow(LLMRateLimitError);
  });

  it("maps APIConnectionError to LLMNetworkError", async () => {
    const sdkError = new Error("Connection error");
    sdkError.name = "APIConnectionError";
    (sdkError as Record<string, unknown>).status = undefined;
    mockCreate.mockRejectedValue(sdkError);

    await expect(service.classify("test")).rejects.toThrow(LLMNetworkError);
  });

  it("maps unknown errors to LLMError", async () => {
    mockCreate.mockRejectedValue(new Error("Something unexpected"));

    await expect(service.classify("test")).rejects.toThrow(LLMError);
  });
});
