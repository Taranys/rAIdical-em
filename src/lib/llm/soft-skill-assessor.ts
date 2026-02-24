// US-2.10: Soft skill assessment — types, prompt builder, response parser

// --- Types ---

export interface SoftSkillComment {
  body: string;
  category: string;
  filePath: string | null;
  prTitle: string;
}

export interface SoftSkillDefinition {
  name: string;
  description: string;
}

export interface SoftSkillInput {
  teamMemberName: string;
  comments: SoftSkillComment[];
  softSkills: SoftSkillDefinition[];
}

export interface SoftSkillScore {
  name: string;
  score: number; // 0-100
  reasoning: string;
}

export interface SoftSkillResult {
  scores: SoftSkillScore[];
}

export interface SoftSkillParseError {
  error: string;
  rawContent: string;
}

// --- Prompt builder ---

export function buildSoftSkillPrompt(input: SoftSkillInput): string {
  const commentsBlock = input.comments
    .map(
      (c, i) =>
        `Comment #${i + 1}:
Category: ${c.category}
PR: ${c.prTitle}${c.filePath ? `\nFile: ${c.filePath}` : ""}
Body:
"""
${c.body}
"""`,
    )
    .join("\n\n");

  const skillsBlock = input.softSkills
    .map((s) => `- **${s.name}**: ${s.description}`)
    .join("\n");

  return `You are a code review behavioral analyst. You are evaluating the soft skills of "${input.teamMemberName}" based on their review comments.

Here are ${input.comments.length} review comments from this team member:

${commentsBlock}

Evaluate the following soft skills based on the comments above. For each skill, assign a score from 0 to 100 and provide a brief justification (1-2 sentences).

Soft skills to evaluate:
${skillsBlock}

Scoring guidelines:
- 0-30: Little to no evidence of this skill in the comments
- 31-50: Some evidence but inconsistent or limited
- 51-70: Clear and consistent demonstration of this skill
- 71-100: Strong, exceptional demonstration of this skill

Rules:
- Always return valid JSON with no markdown fences, no extra text.
- Evaluate ONLY the soft skills listed above — do not add or skip any.
- Base your assessment solely on the provided comments.

Respond with this exact JSON structure:
{
  "scores": [
    {
      "name": "<skill name exactly as listed>",
      "score": <integer 0-100>,
      "reasoning": "<1-2 sentence justification>"
    }
  ]
}`;
}

// --- Response parser ---

export function parseSoftSkillResponse(
  content: string,
): SoftSkillResult | SoftSkillParseError {
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

  if (!Array.isArray(obj.scores)) {
    return {
      error: "Missing or invalid 'scores' array",
      rawContent: content,
    };
  }

  const scores: SoftSkillScore[] = [];
  for (const item of obj.scores) {
    if (typeof item !== "object" || item === null) {
      return { error: "Score item is not an object", rawContent: content };
    }
    const s = item as Record<string, unknown>;

    if (typeof s.name !== "string" || s.name.trim().length === 0) {
      return {
        error: `Invalid or missing name: ${String(s.name)}`,
        rawContent: content,
      };
    }

    if (
      typeof s.score !== "number" ||
      s.score < 0 ||
      s.score > 100 ||
      !Number.isInteger(s.score)
    ) {
      return {
        error: `Invalid score for ${s.name}: ${String(s.score)} (must be integer 0-100)`,
        rawContent: content,
      };
    }

    if (typeof s.reasoning !== "string" || s.reasoning.trim().length === 0) {
      return {
        error: `Missing or empty reasoning for ${s.name}`,
        rawContent: content,
      };
    }

    scores.push({
      name: s.name.trim(),
      score: s.score,
      reasoning: s.reasoning.trim(),
    });
  }

  return { scores };
}

// --- Type guard ---

export function isSoftSkillError(
  result: SoftSkillResult | SoftSkillParseError,
): result is SoftSkillParseError {
  return "error" in result;
}
