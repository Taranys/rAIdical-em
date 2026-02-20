// US-2.04: Classification prompt engineering — types, prompt builder, response parser

// --- Types ---

export type CommentCategory =
  | "bug_correctness"
  | "security"
  | "performance"
  | "readability_maintainability"
  | "nitpick_style"
  | "architecture_design"
  | "missing_test_coverage"
  | "question_clarification";

export const COMMENT_CATEGORIES: CommentCategory[] = [
  "bug_correctness",
  "security",
  "performance",
  "readability_maintainability",
  "nitpick_style",
  "architecture_design",
  "missing_test_coverage",
  "question_clarification",
];

export interface ClassificationInput {
  body: string;
  filePath?: string;
  prTitle?: string;
  diffSnippet?: string;
}

export interface ClassificationResult {
  category: CommentCategory;
  confidence: number; // 0–100 integer (DB-ready)
  reasoning: string;
}

export interface ClassificationParseError {
  error: string;
  rawContent: string;
}

// --- Prompt builder ---

export function buildClassificationPrompt(input: ClassificationInput): string {
  const categoryDescriptions = `- bug_correctness: Points out bugs, logic errors, incorrect behavior, or missing null checks
- security: Flags security vulnerabilities, injection risks, or unsafe practices
- performance: Highlights performance bottlenecks, inefficient algorithms, or unnecessary re-renders
- readability_maintainability: Suggests clearer naming, better structure, or easier-to-read code
- nitpick_style: Minor style/formatting preferences, often subjective (e.g., trailing commas, spacing)
- architecture_design: Addresses design patterns, system structure, API contracts, or architectural concerns
- missing_test_coverage: Points out missing tests, untested edge cases, or poor test quality
- question_clarification: Asks a question or seeks clarification about intent or behavior`;

  const contextLines: string[] = [];
  if (input.prTitle) contextLines.push(`PR Title: ${input.prTitle}`);
  if (input.filePath) contextLines.push(`File: ${input.filePath}`);
  if (input.diffSnippet) contextLines.push(`Diff snippet:\n${input.diffSnippet}`);

  const contextSection =
    contextLines.length > 0 ? `\n\nContext:\n${contextLines.join("\n")}` : "";

  return `You are a code review analyst. Classify the following code review comment into exactly one category.

Categories and their meaning:
${categoryDescriptions}

Rules:
- If the comment is very short or lacks specific content (e.g. "LGTM", "+1"), classify as "question_clarification" with low confidence (0.1–0.3).
- If the comment appears bot-generated (automated messages, dependency update notices), classify as "nitpick_style" with confidence 0.4.
- If the comment covers multiple topics, pick the single most dominant category.
- Always return valid JSON with no markdown fences, no extra text.${contextSection}

Comment to classify:
"""
${input.body}
"""

Respond with this exact JSON structure:
{
  "category": "<one of the 8 categories>",
  "confidence": <float between 0.0 and 1.0>,
  "reasoning": "<one sentence explaining the classification>"
}`;
}

// --- Response parser ---

export function parseClassificationResponse(
  content: string
): ClassificationResult | ClassificationParseError {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\n?/, "")
    .replace(/\n?```$/, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { error: "Response is not valid JSON", rawContent: content };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { error: "Response is not a JSON object", rawContent: content };
  }

  const obj = parsed as Record<string, unknown>;

  // Validate category
  if (
    typeof obj.category !== "string" ||
    !COMMENT_CATEGORIES.includes(obj.category as CommentCategory)
  ) {
    return {
      error: `Invalid category: ${String(obj.category)}`,
      rawContent: content,
    };
  }

  // Validate confidence (float 0-1)
  if (
    typeof obj.confidence !== "number" ||
    obj.confidence < 0 ||
    obj.confidence > 1
  ) {
    return {
      error: `Invalid confidence: ${String(obj.confidence)}`,
      rawContent: content,
    };
  }

  // Validate reasoning
  if (typeof obj.reasoning !== "string" || obj.reasoning.trim().length === 0) {
    return { error: "Missing or empty reasoning", rawContent: content };
  }

  return {
    category: obj.category as CommentCategory,
    confidence: Math.round(obj.confidence * 100),
    reasoning: obj.reasoning.trim(),
  };
}

// --- Type guard ---

export function isClassificationError(
  result: ClassificationResult | ClassificationParseError
): result is ClassificationParseError {
  return "error" in result;
}
