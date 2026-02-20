// US-2.02: LLM abstraction layer — barrel export
export type { LLMService, LLMResponse } from "./types";
export { LLMError, LLMAuthError, LLMRateLimitError, LLMNetworkError } from "./types";
export { createLLMService, createLLMServiceFromSettings } from "./factory";
export { withRetry } from "./retry";
// US-2.04: Classification prompt engineering
export type { ClassificationInput, ClassificationResult, ClassificationParseError, CommentCategory } from "./classifier";
export { COMMENT_CATEGORIES, buildClassificationPrompt, parseClassificationResponse, isClassificationError } from "./classifier";
