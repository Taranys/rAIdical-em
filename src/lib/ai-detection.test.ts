// US-020: AI detection heuristics unit tests
import { describe, it, expect } from "vitest";
import {
  matchesGlob,
  matchesAnyGlob,
  hasCoAuthorMatch,
  classifyPullRequest,
  migrateConfig,
  DEFAULT_AI_HEURISTICS,
  type AiHeuristicsConfig,
  type PrData,
  type CommitData,
} from "./ai-detection";

describe("matchesGlob", () => {
  it("matches exact string", () => {
    expect(matchesGlob("hello", "hello")).toBe(true);
  });

  it("matches wildcard at both ends", () => {
    expect(matchesGlob("Claude Code", "*Claude*")).toBe(true);
  });

  it("matches wildcard at start only", () => {
    expect(matchesGlob("my-bot", "*bot")).toBe(true);
  });

  it("matches wildcard at end only", () => {
    expect(matchesGlob("ai/feature-123", "ai/*")).toBe(true);
  });

  it("does not match different string", () => {
    expect(matchesGlob("human-dev", "*Claude*")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(matchesGlob("CLAUDE code", "*claude*")).toBe(true);
  });

  it("handles special regex chars in pattern", () => {
    expect(matchesGlob("dependabot[bot]", "*[bot]*")).toBe(true);
  });

  it("matches empty pattern against empty string", () => {
    expect(matchesGlob("", "")).toBe(true);
  });

  it("does not match empty string against non-empty pattern", () => {
    expect(matchesGlob("", "abc")).toBe(false);
  });
});

describe("matchesAnyGlob", () => {
  it("returns true if any pattern matches", () => {
    expect(matchesAnyGlob("Claude", ["*Copilot*", "*Claude*"])).toBe(true);
  });

  it("returns false if no pattern matches", () => {
    expect(matchesAnyGlob("human", ["*Claude*", "*Copilot*"])).toBe(false);
  });

  it("returns false for empty patterns array", () => {
    expect(matchesAnyGlob("anything", [])).toBe(false);
  });
});

describe("hasCoAuthorMatch", () => {
  it("finds Co-Authored-By trailer matching a pattern", () => {
    const msg = "Fix bug\n\nCo-Authored-By: Claude Opus <noreply@anthropic.com>";
    expect(hasCoAuthorMatch(msg, ["*Claude*"])).toBe(true);
  });

  it("returns false when no co-author trailer present", () => {
    expect(hasCoAuthorMatch("Regular commit message", ["*Claude*"])).toBe(
      false,
    );
  });

  it("matches [bot] pattern in co-author", () => {
    const msg = "Update deps\n\nCo-Authored-By: github-actions[bot] <noreply>";
    expect(hasCoAuthorMatch(msg, ["*[bot]*"])).toBe(true);
  });

  it("returns false when co-author does not match any pattern", () => {
    const msg = "Fix\n\nCo-Authored-By: John Doe <john@example.com>";
    expect(hasCoAuthorMatch(msg, ["*Claude*", "*Copilot*"])).toBe(false);
  });

  it("handles multiple co-authors, matching any", () => {
    const msg =
      "Fix\n\nCo-Authored-By: John <j@x.com>\nCo-Authored-By: Claude <c@a.com>";
    expect(hasCoAuthorMatch(msg, ["*Claude*"])).toBe(true);
  });

  it("handles empty commit message", () => {
    expect(hasCoAuthorMatch("", ["*Claude*"])).toBe(false);
  });
});

describe("classifyPullRequest", () => {
  const defaultConfig = DEFAULT_AI_HEURISTICS;

  function makePr(overrides: Partial<PrData> = {}): PrData {
    return {
      author: "human-dev",
      ...overrides,
    };
  }

  function makeCommit(message: string): CommitData {
    return { message };
  }

  // Bot classification tests
  it("returns 'bot' with reason when author matches bot list", () => {
    const pr = makePr({ author: "dependabot" });
    const result = classifyPullRequest(pr, [], defaultConfig);
    expect(result.classification).toBe("bot");
    expect(result.reason).toBe("Author 'dependabot' matches bot list");
  });

  it("returns 'bot' with reason when author matches dependabot[bot]", () => {
    const pr = makePr({ author: "dependabot[bot]" });
    const result = classifyPullRequest(pr, [], defaultConfig);
    expect(result.classification).toBe("bot");
    expect(result.reason).toBe("Author 'dependabot[bot]' matches bot list");
  });

  it("returns 'bot' case-insensitively", () => {
    const pr = makePr({ author: "Dependabot" });
    const result = classifyPullRequest(pr, [], defaultConfig);
    expect(result.classification).toBe("bot");
    expect(result.reason).toBe("Author 'Dependabot' matches bot list");
  });

  it("returns 'bot' when author is renovate[bot]", () => {
    const pr = makePr({ author: "renovate[bot]" });
    const result = classifyPullRequest(pr, [], defaultConfig);
    expect(result.classification).toBe("bot");
  });

  it("bot takes priority over AI co-authors", () => {
    const pr = makePr({ author: "dependabot[bot]" });
    const commits = [
      makeCommit("Update deps\n\nCo-Authored-By: Claude <noreply>"),
    ];
    const result = classifyPullRequest(pr, commits, defaultConfig);
    expect(result.classification).toBe("bot");
  });

  // AI classification tests
  it("returns 'ai' with reason when all commits have AI co-author", () => {
    const pr = makePr();
    const commits = [
      makeCommit("Fix\n\nCo-Authored-By: Claude <noreply>"),
      makeCommit("Update\n\nCo-Authored-By: Copilot <noreply>"),
    ];
    const result = classifyPullRequest(pr, commits, defaultConfig);
    expect(result.classification).toBe("ai");
    expect(result.reason).toBe("All 2/2 commits have Co-Authored-By matching AI patterns");
  });

  it("returns 'ai' when single commit has AI co-author", () => {
    const pr = makePr();
    const commits = [
      makeCommit(
        "Fix bug\n\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>",
      ),
    ];
    const result = classifyPullRequest(pr, commits, defaultConfig);
    expect(result.classification).toBe("ai");
    expect(result.reason).toBe("All 1/1 commits have Co-Authored-By matching AI patterns");
  });

  // Mixed classification tests
  it("returns 'mixed' with reason when only some commits have AI co-author", () => {
    const pr = makePr();
    const commits = [
      makeCommit("Human commit"),
      makeCommit("AI commit\n\nCo-Authored-By: Claude <noreply>"),
    ];
    const result = classifyPullRequest(pr, commits, defaultConfig);
    expect(result.classification).toBe("mixed");
    expect(result.reason).toBe("1/2 commits have Co-Authored-By matching AI patterns");
  });

  it("returns 'mixed' when 1 of 3 commits has AI co-author", () => {
    const pr = makePr();
    const commits = [
      makeCommit("Regular commit"),
      makeCommit("Another commit"),
      makeCommit("Last one\n\nCo-Authored-By: Copilot <noreply>"),
    ];
    const result = classifyPullRequest(pr, commits, defaultConfig);
    expect(result.classification).toBe("mixed");
    expect(result.reason).toBe("1/3 commits have Co-Authored-By matching AI patterns");
  });

  // Human classification tests
  it("returns 'human' with reason when no commits", () => {
    const pr = makePr();
    const result = classifyPullRequest(pr, [], defaultConfig);
    expect(result.classification).toBe("human");
    expect(result.reason).toBe("No commits to analyze");
  });

  it("returns 'human' with reason when commits have no AI co-authors", () => {
    const pr = makePr();
    const commits = [
      makeCommit("Human commit"),
      makeCommit("Another human commit"),
    ];
    const result = classifyPullRequest(pr, commits, defaultConfig);
    expect(result.classification).toBe("human");
    expect(result.reason).toBe("No AI co-author found in 2 commits");
  });

  it("returns 'human' with 0 commits", () => {
    const pr = makePr();
    const result = classifyPullRequest(pr, [], defaultConfig);
    expect(result.classification).toBe("human");
    expect(result.reason).toBe("No commits to analyze");
  });

  // Branch name and labels should NOT affect classification
  it("branch name does not affect classification (AI-named branch, human commits)", () => {
    const pr = makePr({ author: "human-dev" });
    const commits = [makeCommit("Regular commit")];
    const result = classifyPullRequest(pr, commits, defaultConfig);
    expect(result.classification).toBe("human");
    expect(result.reason).toBe("No AI co-author found in 1 commits");
  });

  // Disabled heuristics tests
  it("returns 'human' when all heuristics are disabled", () => {
    const config: AiHeuristicsConfig = {
      ...defaultConfig,
      enabled: { coAuthor: false, authorBot: false },
    };
    const pr = makePr({ author: "dependabot" });
    const result = classifyPullRequest(pr, [], config);
    expect(result.classification).toBe("human");
    expect(result.reason).toBe("No commits to analyze");
  });

  it("returns 'human' when bot detection disabled and author is bot", () => {
    const config: AiHeuristicsConfig = {
      ...defaultConfig,
      enabled: { coAuthor: true, authorBot: false },
    };
    const pr = makePr({ author: "dependabot[bot]" });
    const result = classifyPullRequest(pr, [], config);
    expect(result.classification).toBe("human");
    expect(result.reason).toBe("No commits to analyze");
  });

  it("returns 'human' when co-author detection disabled even with AI co-authors", () => {
    const config: AiHeuristicsConfig = {
      ...defaultConfig,
      enabled: { coAuthor: false, authorBot: true },
    };
    const pr = makePr();
    const commits = [
      makeCommit("Fix\n\nCo-Authored-By: Claude <noreply>"),
    ];
    const result = classifyPullRequest(pr, commits, config);
    expect(result.classification).toBe("human");
    expect(result.reason).toBe("No AI co-author found in 1 commits");
  });

  it("only bot detection works when co-author disabled", () => {
    const config: AiHeuristicsConfig = {
      ...defaultConfig,
      enabled: { coAuthor: false, authorBot: true },
    };
    const pr = makePr({ author: "dependabot" });
    const result = classifyPullRequest(pr, [], config);
    expect(result.classification).toBe("bot");
  });
});

describe("migrateConfig", () => {
  it("returns defaults for null input", () => {
    expect(migrateConfig(null)).toEqual(DEFAULT_AI_HEURISTICS);
  });

  it("returns defaults for non-object input", () => {
    expect(migrateConfig("invalid")).toEqual(DEFAULT_AI_HEURISTICS);
  });

  it("passes through new-shape config unchanged", () => {
    const newConfig: AiHeuristicsConfig = {
      coAuthorPatterns: ["*MyBot*"],
      authorBotList: ["custom-bot"],
      enabled: { coAuthor: true, authorBot: false },
    };
    expect(migrateConfig(newConfig)).toEqual(newConfig);
  });

  it("migrates legacy 4-heuristic config to new shape", () => {
    const legacyConfig = {
      coAuthorPatterns: ["*Claude*"],
      authorBotList: ["dependabot"],
      branchNamePatterns: ["ai/*"],
      labels: ["ai-generated"],
      enabled: { coAuthor: true, authorBot: false, branchName: true, label: true },
    };

    const result = migrateConfig(legacyConfig);

    expect(result).toEqual({
      coAuthorPatterns: ["*Claude*"],
      authorBotList: ["dependabot"],
      enabled: { coAuthor: true, authorBot: false },
    });
  });

  it("uses defaults for missing fields in legacy config", () => {
    const partial = {
      enabled: { coAuthor: false, authorBot: true, branchName: true, label: true },
    };

    const result = migrateConfig(partial);

    expect(result.coAuthorPatterns).toEqual(DEFAULT_AI_HEURISTICS.coAuthorPatterns);
    expect(result.authorBotList).toEqual(DEFAULT_AI_HEURISTICS.authorBotList);
    expect(result.enabled.coAuthor).toBe(false);
    expect(result.enabled.authorBot).toBe(true);
  });
});
