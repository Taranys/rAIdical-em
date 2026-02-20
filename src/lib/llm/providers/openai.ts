// US-2.02: OpenAI LLM provider implementation
import OpenAI from "openai";
import { withRetry } from "../retry";
import type { LLMService, LLMResponse } from "../types";
import { LLMAuthError, LLMRateLimitError, LLMNetworkError, LLMError } from "../types";

function mapError(error: unknown): never {
  if (error instanceof Error) {
    const status = (error as unknown as Record<string, unknown>).status;
    if (status === 401 || status === 403) throw new LLMAuthError("openai", error);
    if (status === 429) throw new LLMRateLimitError("openai", error);
    if (error.name === "APIConnectionError" || status === undefined) {
      throw new LLMNetworkError("openai", error);
    }
  }
  throw new LLMError(String(error), "openai", error);
}

export class OpenAIService implements LLMService {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async classify(prompt: string): Promise<LLMResponse> {
    return withRetry(async () => {
      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
        });

        const content = response.choices[0]?.message?.content ?? "";
        const usage = response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
            }
          : undefined;

        return { content, usage };
      } catch (error) {
        mapError(error);
      }
    });
  }
}
