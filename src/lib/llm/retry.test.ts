// US-2.02: Unit tests for retry with exponential backoff
import { describe, it, expect, vi, beforeEach } from "vitest";
import { withRetry } from "./retry";
import { LLMAuthError, LLMRateLimitError, LLMNetworkError, LLMError } from "./types";

describe("withRetry", () => {
  const mockSleep = vi.fn<(ms: number) => Promise<void>>().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");

    const result = await withRetry(fn, { sleep: mockSleep });

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(mockSleep).not.toHaveBeenCalled();
  });

  it("retries on LLMRateLimitError and succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new LLMRateLimitError("openai"))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, { sleep: mockSleep });

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(mockSleep).toHaveBeenCalledTimes(1);
    expect(mockSleep).toHaveBeenCalledWith(1000);
  });

  it("retries on LLMNetworkError and succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new LLMNetworkError("anthropic"))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, { sleep: mockSleep });

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("uses exponential backoff: 1s, 2s, 4s", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new LLMRateLimitError("openai"))
      .mockRejectedValueOnce(new LLMRateLimitError("openai"))
      .mockRejectedValueOnce(new LLMRateLimitError("openai"));

    await expect(withRetry(fn, { sleep: mockSleep })).rejects.toThrow(LLMRateLimitError);

    expect(fn).toHaveBeenCalledTimes(3);
    expect(mockSleep).toHaveBeenCalledTimes(2);
    expect(mockSleep).toHaveBeenNthCalledWith(1, 1000);
    expect(mockSleep).toHaveBeenNthCalledWith(2, 2000);
  });

  it("throws immediately on LLMAuthError without retrying", async () => {
    const fn = vi.fn().mockRejectedValue(new LLMAuthError("openai"));

    await expect(withRetry(fn, { sleep: mockSleep })).rejects.toThrow(LLMAuthError);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(mockSleep).not.toHaveBeenCalled();
  });

  it("throws after max retries are exhausted", async () => {
    const fn = vi.fn().mockRejectedValue(new LLMNetworkError("google"));

    await expect(withRetry(fn, { sleep: mockSleep })).rejects.toThrow(LLMNetworkError);

    expect(fn).toHaveBeenCalledTimes(3);
    expect(mockSleep).toHaveBeenCalledTimes(2);
  });

  it("does not retry on generic LLMError", async () => {
    const fn = vi.fn().mockRejectedValue(new LLMError("unknown", "openai"));

    await expect(withRetry(fn, { sleep: mockSleep })).rejects.toThrow(LLMError);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(mockSleep).not.toHaveBeenCalled();
  });

  it("respects custom maxRetries", async () => {
    const fn = vi.fn().mockRejectedValue(new LLMRateLimitError("openai"));

    await expect(withRetry(fn, { sleep: mockSleep, maxRetries: 5 })).rejects.toThrow(
      LLMRateLimitError,
    );

    expect(fn).toHaveBeenCalledTimes(5);
    expect(mockSleep).toHaveBeenCalledTimes(4);
  });
});
