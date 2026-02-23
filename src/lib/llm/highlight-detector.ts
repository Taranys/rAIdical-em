// US-2.12: Best comment detection — types, prompt builder, response parser

// --- Types ---

export interface CommentForHighlightEvaluation {
  commentId: number;
  commentType: "review_comment" | "pr_comment";
  body: string;
  category: string;
  confidence: number;
  filePath: string | null;
  prTitle: string;
}

export interface HighlightInput {
  teamMemberName: string;
  comments: CommentForHighlightEvaluation[];
}

export interface HighlightSelection {
  commentId: number;
  commentType: "review_comment" | "pr_comment";
  reasoning: string;
}

export interface HighlightResult {
  selections: HighlightSelection[];
}

export interface HighlightParseError {
  error: string;
  rawContent: string;
}

// --- Prompt builder ---

export function buildHighlightPrompt(input: HighlightInput): string {
  const commentsBlock = input.comments
    .map(
      (c, i) =>
        `Comment #${i + 1} (ID: ${c.commentId}, type: ${c.commentType}):
Category: ${c.category} (confidence: ${c.confidence}%)
PR: ${c.prTitle}${c.filePath ? `\nFile: ${c.filePath}` : ""}
Body:
"""
${c.body}
"""`,
    )
    .join("\n\n");

  return `You are a code review quality analyst. You are evaluating review comments written by "${input.teamMemberName}" to select the best ones — comments that demonstrate strong reviewing skills and provide high value to the team.

Here are ${input.comments.length} high-value review comments from this team member (already classified as bug/correctness, security, or architecture/design with high confidence):

${commentsBlock}

Your task:
1. Evaluate each comment for quality: Is it well-articulated? Does it clearly explain the issue? Does it suggest a fix or path forward? Does it demonstrate deep understanding?
2. Select the top 3 to 5 best comments (at least 3, at most 5). If there are fewer than 3 comments total, select all of them.
3. For each selected comment, write a short justification (1-2 sentences) explaining WHY this is an excellent review comment.

Rules:
- Always return valid JSON with no markdown fences, no extra text.
- Only reference comment IDs that exist in the input above.

Respond with this exact JSON structure:
{
  "selections": [
    {
      "commentId": <number>,
      "commentType": "<review_comment or pr_comment>",
      "reasoning": "<1-2 sentence justification>"
    }
  ]
}`;
}

// --- Response parser ---

export function parseHighlightResponse(
  content: string,
): HighlightResult | HighlightParseError {
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

  if (!Array.isArray(obj.selections)) {
    return {
      error: "Missing or invalid 'selections' array",
      rawContent: content,
    };
  }

  const selections: HighlightSelection[] = [];
  for (const item of obj.selections) {
    if (typeof item !== "object" || item === null) {
      return { error: "Selection item is not an object", rawContent: content };
    }
    const sel = item as Record<string, unknown>;

    if (typeof sel.commentId !== "number") {
      return {
        error: `Invalid commentId: ${String(sel.commentId)}`,
        rawContent: content,
      };
    }
    if (
      sel.commentType !== "review_comment" &&
      sel.commentType !== "pr_comment"
    ) {
      return {
        error: `Invalid commentType: ${String(sel.commentType)}`,
        rawContent: content,
      };
    }
    if (typeof sel.reasoning !== "string" || sel.reasoning.trim().length === 0) {
      return { error: "Missing or empty reasoning", rawContent: content };
    }

    selections.push({
      commentId: sel.commentId,
      commentType: sel.commentType,
      reasoning: sel.reasoning.trim(),
    });
  }

  return { selections };
}

// --- Type guard ---

export function isHighlightError(
  result: HighlightResult | HighlightParseError,
): result is HighlightParseError {
  return "error" in result;
}
