// US-2.13: Growth opportunity detection — types, prompt builder, response parser

// --- Types ---

export interface CommentForGrowthEvaluation {
  commentId: number;
  commentType: "review_comment" | "pr_comment";
  body: string;
  category: string;
  confidence: number;
  filePath: string | null;
  prTitle: string;
  prHadHighValueIssues: boolean;
}

export interface GrowthOpportunityInput {
  teamMemberName: string;
  comments: CommentForGrowthEvaluation[];
}

export interface GrowthOpportunitySelection {
  commentId: number;
  commentType: "review_comment" | "pr_comment";
  suggestion: string;
}

export interface GrowthOpportunityResult {
  opportunities: GrowthOpportunitySelection[];
}

export interface GrowthOpportunityParseError {
  error: string;
  rawContent: string;
}

// --- Prompt builder ---

export function buildGrowthOpportunityPrompt(
  input: GrowthOpportunityInput,
): string {
  const commentsBlock = input.comments
    .map(
      (c, i) =>
        `Comment #${i + 1} (ID: ${c.commentId}, type: ${c.commentType}):
Category: ${c.category} (confidence: ${c.confidence}%)
PR: ${c.prTitle}${c.filePath ? `\nFile: ${c.filePath}` : ""}${c.prHadHighValueIssues ? "\n⚠️ Context: Other reviewers found serious issues (bug/security) in this same PR" : ""}
Body:
"""
${c.body}
"""`,
    )
    .join("\n\n");

  return `You are a code review quality coach. You are evaluating review comments written by "${input.teamMemberName}" to identify growth opportunities — moments where the reviewer could have gone deeper.

Here are ${input.comments.length} lower-depth review comments from this team member (classified as nitpick/style or clarification questions):

${commentsBlock}

Your task:
1. Evaluate each comment: Was this a missed opportunity to go deeper? Could the reviewer have spotted something more significant?
2. Prioritize comments on PRs where other reviewers found serious issues (marked with ⚠️) — these are strong signals the reviewer was not reviewing at sufficient depth.
3. Select up to 3 comments that represent the clearest growth opportunities.
4. For each selected comment, write a concrete "suggestion" (2-3 sentences): what would a stronger review have looked like? What question should have been asked? What issue could have been spotted?

Rules:
- Only select comments where there's a genuinely actionable suggestion to make.
- If no comment represents a real growth opportunity, return an empty array.
- Always return valid JSON with no markdown fences, no extra text.
- Only reference comment IDs that exist in the input above.

Respond with this exact JSON structure:
{
  "opportunities": [
    {
      "commentId": <number>,
      "commentType": "<review_comment or pr_comment>",
      "suggestion": "<2-3 sentence concrete suggestion for improvement>"
    }
  ]
}`;
}

// --- Response parser ---

export function parseGrowthOpportunityResponse(
  content: string,
): GrowthOpportunityResult | GrowthOpportunityParseError {
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

  if (!Array.isArray(obj.opportunities)) {
    return {
      error: "Missing or invalid 'opportunities' array",
      rawContent: content,
    };
  }

  const opportunities: GrowthOpportunitySelection[] = [];
  for (const item of obj.opportunities) {
    if (typeof item !== "object" || item === null) {
      return {
        error: "Opportunity item is not an object",
        rawContent: content,
      };
    }
    const opp = item as Record<string, unknown>;

    if (typeof opp.commentId !== "number") {
      return {
        error: `Invalid commentId: ${String(opp.commentId)}`,
        rawContent: content,
      };
    }
    if (
      opp.commentType !== "review_comment" &&
      opp.commentType !== "pr_comment"
    ) {
      return {
        error: `Invalid commentType: ${String(opp.commentType)}`,
        rawContent: content,
      };
    }
    if (
      typeof opp.suggestion !== "string" ||
      opp.suggestion.trim().length === 0
    ) {
      return { error: "Missing or empty suggestion", rawContent: content };
    }

    opportunities.push({
      commentId: opp.commentId,
      commentType: opp.commentType,
      suggestion: opp.suggestion.trim(),
    });
  }

  return { opportunities };
}

// --- Type guard ---

export function isGrowthOpportunityError(
  result: GrowthOpportunityResult | GrowthOpportunityParseError,
): result is GrowthOpportunityParseError {
  return "error" in result;
}
