// US-2.02: Unit tests for Anthropic LLM provider
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  const MockAnthropic = vi.fn(function () {
    return { messages: { create: mockCreate } };
  });
  return { default: MockAnthropic };
});

vi.mock("../retry", () => ({
  withRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

import Anthropic from "@anthropic-ai/sdk";
import { AnthropicService } from "./anthropic";
import { LLMAuthError, LLMRateLimitError, LLMNetworkError, LLMError } from "../types";

describe("AnthropicService", () => {
  let service: AnthropicService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AnthropicService("sk-ant-test", "claude-sonnet-4-5-20250929");
  });

  it("creates Anthropic client with the provided API key", () => {
    expect(Anthropic).toHaveBeenCalledWith({ apiKey: "sk-ant-test" });
  });

  it("calls messages.create with the correct parameters", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "response" }],
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    await service.classify("test prompt");

    expect(mockCreate).toHaveBeenCalledWith({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      messages: [{ role: "user", content: "test prompt" }],
    });
  });

  it("returns content and usage from the response", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "classified result" }],
      usage: { input_tokens: 15, output_tokens: 25 },
    });

    const result = await service.classify("test prompt");

    expect(result.content).toBe("classified result");
    expect(result.usage).toEqual({ promptTokens: 15, completionTokens: 25 });
  });

  it("handles empty content blocks", async () => {
    mockCreate.mockResolvedValue({
      content: [],
      usage: { input_tokens: 5, output_tokens: 0 },
    });

    const result = await service.classify("test prompt");

    expect(result.content).toBe("");
  });

  it("concatenates multiple text blocks", async () => {
    mockCreate.mockResolvedValue({
      content: [
        { type: "text", text: "part1" },
        { type: "text", text: " part2" },
      ],
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    const result = await service.classify("test prompt");

    expect(result.content).toBe("part1 part2");
  });

  it("maps AuthenticationError (status 401) to LLMAuthError", async () => {
    const sdkError = new Error("Invalid API key");
    (sdkError as Record<string, unknown>).status = 401;
    mockCreate.mockRejectedValue(sdkError);

    await expect(service.classify("test")).rejects.toThrow(LLMAuthError);
  });

  it("maps RateLimitError (status 429) to LLMRateLimitError", async () => {
    const sdkError = new Error("Rate limit");
    (sdkError as Record<string, unknown>).status = 429;
    mockCreate.mockRejectedValue(sdkError);

    await expect(service.classify("test")).rejects.toThrow(LLMRateLimitError);
  });

  it("maps connection errors to LLMNetworkError", async () => {
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
