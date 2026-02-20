// US-2.02: Retry with exponential backoff for LLM calls
import { LLMRateLimitError, LLMNetworkError } from "./types";

interface RetryOptions {
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
}

const DEFAULT_SLEEP = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function isRetryable(error: unknown): boolean {
  return error instanceof LLMRateLimitError || error instanceof LLMNetworkError;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxRetries = 3, sleep = DEFAULT_SLEEP } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryable(error) || attempt === maxRetries) {
        throw error;
      }

      const delayMs = 1000 * Math.pow(2, attempt - 1);
      await sleep(delayMs);
    }
  }

  throw lastError;
}
