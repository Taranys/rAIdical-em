// US-2.02: LLM abstraction layer types and errors

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface LLMService {
  classify(prompt: string): Promise<LLMResponse>;
}

// --- Typed errors ---

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "LLMError";
  }
}

export class LLMAuthError extends LLMError {
  constructor(provider: string, cause?: unknown) {
    super("Authentication failed — check your API key", provider, cause);
    this.name = "LLMAuthError";
  }
}

export class LLMRateLimitError extends LLMError {
  constructor(provider: string, cause?: unknown) {
    super("Rate limit exceeded — try again later", provider, cause);
    this.name = "LLMRateLimitError";
  }
}

export class LLMNetworkError extends LLMError {
  constructor(provider: string, cause?: unknown) {
    super("Network error — check your connection", provider, cause);
    this.name = "LLMNetworkError";
  }
}
