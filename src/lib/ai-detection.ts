// US-020: AI detection heuristics and classification logic

export type AiClassification = "ai" | "human" | "mixed" | "bot";

export interface AiHeuristicsConfig {
  coAuthorPatterns: string[];
  authorBotList: string[];
  enabled: {
    coAuthor: boolean;
    authorBot: boolean;
  };
}

export interface PrData {
  author: string;
}

export interface CommitData {
  message: string;
}

export const DEFAULT_AI_HEURISTICS: AiHeuristicsConfig = {
  coAuthorPatterns: ["*Claude*", "*Copilot*", "*[bot]*"],
  authorBotList: [
    "dependabot",
    "renovate",
    "dependabot[bot]",
    "renovate[bot]",
  ],
  enabled: {
    coAuthor: true,
    authorBot: true,
  },
};

// Convert a simple glob pattern (only * wildcard) to a regex and test.
// Special regex characters in the pattern are escaped except *.
export function matchesGlob(text: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    "^" + escaped.replace(/\*/g, ".*") + "$",
    "i",
  );
  return regex.test(text);
}

export function matchesAnyGlob(text: string, patterns: string[]): boolean {
  return patterns.some((p) => matchesGlob(text, p));
}

export function hasCoAuthorMatch(
  commitMessage: string,
  patterns: string[],
): boolean {
  const coAuthorRegex = /Co-Authored-By:\s*(.+)/gi;
  let match: RegExpExecArray | null;
  while ((match = coAuthorRegex.exec(commitMessage)) !== null) {
    if (matchesAnyGlob(match[1].trim(), patterns)) {
      return true;
    }
  }
  return false;
}

// Migrate legacy config (old 4-heuristic shape) to new 2-heuristic shape.
export function migrateConfig(stored: unknown): AiHeuristicsConfig {
  if (!stored || typeof stored !== "object") return DEFAULT_AI_HEURISTICS;

  const s = stored as Record<string, unknown>;

  // Already new shape: has enabled.coAuthor but no branchNamePatterns
  if (
    Array.isArray(s.coAuthorPatterns) &&
    Array.isArray(s.authorBotList) &&
    s.enabled &&
    typeof s.enabled === "object" &&
    !("branchName" in (s.enabled as Record<string, unknown>))
  ) {
    return stored as AiHeuristicsConfig;
  }

  // Legacy shape: extract relevant fields
  const coAuthorPatterns = Array.isArray(s.coAuthorPatterns)
    ? (s.coAuthorPatterns as string[])
    : DEFAULT_AI_HEURISTICS.coAuthorPatterns;

  const authorBotList = Array.isArray(s.authorBotList)
    ? (s.authorBotList as string[])
    : DEFAULT_AI_HEURISTICS.authorBotList;

  const enabledObj = s.enabled as Record<string, unknown> | undefined;
  const coAuthorEnabled =
    enabledObj && typeof enabledObj.coAuthor === "boolean"
      ? enabledObj.coAuthor
      : true;
  const authorBotEnabled =
    enabledObj && typeof enabledObj.authorBot === "boolean"
      ? enabledObj.authorBot
      : true;

  return {
    coAuthorPatterns,
    authorBotList,
    enabled: {
      coAuthor: coAuthorEnabled,
      authorBot: authorBotEnabled,
    },
  };
}

// Classification logic (priority order):
// 1. Bot author check → "bot"
// 2. Co-author: ALL commits have AI co-author → "ai", SOME → "mixed"
// 3. No AI signal → "human"
export function classifyPullRequest(
  pr: PrData,
  commits: CommitData[],
  config: AiHeuristicsConfig,
): AiClassification {
  // 1. Bot detection (highest priority)
  if (config.enabled.authorBot) {
    if (
      config.authorBotList.some(
        (bot) => bot.toLowerCase() === pr.author.toLowerCase(),
      )
    ) {
      return "bot";
    }
  }

  // 2. Commit co-author analysis
  if (config.enabled.coAuthor && commits.length > 0) {
    const matchCount = commits.filter((c) =>
      hasCoAuthorMatch(c.message, config.coAuthorPatterns),
    ).length;
    if (matchCount === commits.length) {
      return "ai";
    } else if (matchCount > 0) {
      return "mixed";
    }
  }

  return "human";
}
