// US-2.02: Google Gemini LLM provider implementation
import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from "@google/generative-ai";
import { withRetry } from "../retry";
import type { LLMService, LLMResponse } from "../types";
import { LLMAuthError, LLMRateLimitError, LLMNetworkError, LLMError } from "../types";

function mapError(error: unknown): never {
  if (error instanceof GoogleGenerativeAIFetchError) {
    if (error.status === 401 || error.status === 403) {
      throw new LLMAuthError("google", error);
    }
    if (error.status === 429) throw new LLMRateLimitError("google", error);
    throw new LLMError(error.message, "google", error);
  }
  if (error instanceof TypeError || error instanceof Error) {
    throw new LLMNetworkError("google", error);
  }
  throw new LLMError(String(error), "google", error);
}

export class GoogleService implements LLMService {
  private model;

  constructor(apiKey: string, modelId: string) {
    const client = new GoogleGenerativeAI(apiKey);
    this.model = client.getGenerativeModel({ model: modelId });
  }

  async classify(prompt: string): Promise<LLMResponse> {
    return withRetry(async () => {
      try {
        const result = await this.model.generateContent(prompt);
        const response = result.response;

        const content = response.text();
        const meta = response.usageMetadata;
        const usage = meta
          ? {
              promptTokens: meta.promptTokenCount,
              completionTokens: meta.candidatesTokenCount,
            }
          : undefined;

        return { content, usage };
      } catch (error) {
        mapError(error);
      }
    });
  }
}
