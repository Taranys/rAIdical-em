// US-020: AI detection heuristics and classification logic

export type AiClassification = "ai" | "human" | "mixed";

export interface AiHeuristicsConfig {
  coAuthorPatterns: string[];
  authorBotList: string[];
  branchNamePatterns: string[];
  labels: string[];
  enabled: {
    coAuthor: boolean;
    authorBot: boolean;
    branchName: boolean;
    label: boolean;
  };
}

export interface PrData {
  author: string;
  branchName: string | null;
  labels: string[];
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
  branchNamePatterns: ["ai/*", "copilot/*", "claude/*"],
  labels: ["ai-generated", "ai-assisted", "bot"],
  enabled: {
    coAuthor: true,
    authorBot: true,
    branchName: true,
    label: true,
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

// Classification logic:
// - Any full AI signal (bot author, AI branch, AI label) → "ai"
// - Co-author: if ALL commits have AI co-author → "ai", if SOME → "mixed"
// - No AI signal from any enabled heuristic → "human"
export function classifyPullRequest(
  pr: PrData,
  commits: CommitData[],
  config: AiHeuristicsConfig,
): AiClassification {
  let hasFullAiSignal = false;
  let hasPartialAiSignal = false;

  if (config.enabled.authorBot) {
    if (
      config.authorBotList.some(
        (bot) => bot.toLowerCase() === pr.author.toLowerCase(),
      )
    ) {
      hasFullAiSignal = true;
    }
  }

  if (config.enabled.branchName && pr.branchName) {
    if (matchesAnyGlob(pr.branchName, config.branchNamePatterns)) {
      hasFullAiSignal = true;
    }
  }

  if (config.enabled.label) {
    if (
      pr.labels.some((l) =>
        config.labels.some((cl) => cl.toLowerCase() === l.toLowerCase()),
      )
    ) {
      hasFullAiSignal = true;
    }
  }

  if (config.enabled.coAuthor && commits.length > 0) {
    const matchCount = commits.filter((c) =>
      hasCoAuthorMatch(c.message, config.coAuthorPatterns),
    ).length;
    if (matchCount === commits.length) {
      hasFullAiSignal = true;
    } else if (matchCount > 0) {
      hasPartialAiSignal = true;
    }
  }

  if (hasFullAiSignal) return "ai";
  if (hasPartialAiSignal) return "mixed";
  return "human";
}
