// US-2.02: Anthropic LLM provider implementation
import Anthropic from "@anthropic-ai/sdk";
import { withRetry } from "../retry";
import type { LLMService, LLMResponse } from "../types";
import { LLMAuthError, LLMRateLimitError, LLMNetworkError, LLMError } from "../types";

function mapError(error: unknown): never {
  if (error instanceof Error) {
    const status = (error as unknown as Record<string, unknown>).status;
    if (status === 401 || status === 403) throw new LLMAuthError("anthropic", error);
    if (status === 429) throw new LLMRateLimitError("anthropic", error);
    if (error.name === "APIConnectionError" || status === undefined) {
      throw new LLMNetworkError("anthropic", error);
    }
  }
  throw new LLMError(String(error), "anthropic", error);
}

export class AnthropicService implements LLMService {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async classify(prompt: string): Promise<LLMResponse> {
    return withRetry(async () => {
      try {
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        });

        const content = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === "text")
          .map((block) => block.text)
          .join("");

        const usage = response.usage
          ? {
              promptTokens: response.usage.input_tokens,
              completionTokens: response.usage.output_tokens,
            }
          : undefined;

        return { content, usage };
      } catch (error) {
        mapError(error);
      }
    });
  }
}
