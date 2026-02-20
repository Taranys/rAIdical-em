// US-2.02: Unit tests for Google Gemini LLM provider
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGenerateContent = vi.fn();

vi.mock("@google/generative-ai", () => {
  const MockGoogleGenerativeAI = vi.fn(function () {
    return {
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    };
  });
  return {
    GoogleGenerativeAI: MockGoogleGenerativeAI,
    GoogleGenerativeAIFetchError: class GoogleGenerativeAIFetchError extends Error {
      status: number;
      statusText: string;
      constructor(message: string, status: number, statusText: string) {
        super(message);
        this.name = "GoogleGenerativeAIFetchError";
        this.status = status;
        this.statusText = statusText;
      }
    },
  };
});

vi.mock("../retry", () => ({
  withRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from "@google/generative-ai";
import { GoogleService } from "./google";
import { LLMAuthError, LLMRateLimitError, LLMNetworkError, LLMError } from "../types";

describe("GoogleService", () => {
  let service: GoogleService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GoogleService("AIza-test", "gemini-2.0-flash");
  });

  it("creates GoogleGenerativeAI client with the provided API key", () => {
    expect(GoogleGenerativeAI).toHaveBeenCalledWith("AIza-test");
  });

  it("calls generateContent with the correct prompt", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "response",
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
      },
    });

    await service.classify("test prompt");

    expect(mockGenerateContent).toHaveBeenCalledWith("test prompt");
  });

  it("returns content and usage from the response", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "classified result",
        usageMetadata: { promptTokenCount: 15, candidatesTokenCount: 25 },
      },
    });

    const result = await service.classify("test prompt");

    expect(result.content).toBe("classified result");
    expect(result.usage).toEqual({ promptTokens: 15, completionTokens: 25 });
  });

  it("handles missing usageMetadata", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "result",
        usageMetadata: undefined,
      },
    });

    const result = await service.classify("test prompt");

    expect(result.content).toBe("result");
    expect(result.usage).toBeUndefined();
  });

  it("maps status 401 to LLMAuthError", async () => {
    mockGenerateContent.mockRejectedValue(
      new GoogleGenerativeAIFetchError("Unauthorized", 401, "Unauthorized"),
    );

    await expect(service.classify("test")).rejects.toThrow(LLMAuthError);
  });

  it("maps status 403 to LLMAuthError", async () => {
    mockGenerateContent.mockRejectedValue(
      new GoogleGenerativeAIFetchError("Forbidden", 403, "Forbidden"),
    );

    await expect(service.classify("test")).rejects.toThrow(LLMAuthError);
  });

  it("maps status 429 to LLMRateLimitError", async () => {
    mockGenerateContent.mockRejectedValue(
      new GoogleGenerativeAIFetchError("Too Many Requests", 429, "Too Many Requests"),
    );

    await expect(service.classify("test")).rejects.toThrow(LLMRateLimitError);
  });

  it("maps generic fetch errors to LLMError", async () => {
    mockGenerateContent.mockRejectedValue(
      new GoogleGenerativeAIFetchError("Server Error", 500, "Internal Server Error"),
    );

    await expect(service.classify("test")).rejects.toThrow(LLMError);
  });

  it("maps non-fetch errors to LLMNetworkError", async () => {
    mockGenerateContent.mockRejectedValue(new TypeError("fetch failed"));

    await expect(service.classify("test")).rejects.toThrow(LLMNetworkError);
  });
});
