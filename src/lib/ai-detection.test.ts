// US-020: AI detection heuristics unit tests
import { describe, it, expect } from "vitest";
import {
  matchesGlob,
  matchesAnyGlob,
  hasCoAuthorMatch,
  classifyPullRequest,
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
      branchName: "feature/my-thing",
      labels: [],
      ...overrides,
    };
  }

  function makeCommit(message: string): CommitData {
    return { message };
  }

  it("returns 'human' when no heuristics match", () => {
    const pr = makePr();
    expect(classifyPullRequest(pr, [], defaultConfig)).toBe("human");
  });

  it("returns 'human' when all heuristics are disabled", () => {
    const config: AiHeuristicsConfig = {
      ...defaultConfig,
      enabled: {
        coAuthor: false,
        authorBot: false,
        branchName: false,
        label: false,
      },
    };
    const pr = makePr({ author: "dependabot" });
    expect(classifyPullRequest(pr, [], config)).toBe("human");
  });

  it("returns 'ai' when author matches bot list", () => {
    const pr = makePr({ author: "dependabot" });
    expect(classifyPullRequest(pr, [], defaultConfig)).toBe("ai");
  });

  it("returns 'ai' when author matches dependabot[bot]", () => {
    const pr = makePr({ author: "dependabot[bot]" });
    expect(classifyPullRequest(pr, [], defaultConfig)).toBe("ai");
  });

  it("returns 'ai' when branch matches pattern", () => {
    const pr = makePr({ branchName: "ai/implement-feature" });
    expect(classifyPullRequest(pr, [], defaultConfig)).toBe("ai");
  });

  it("returns 'ai' when label matches", () => {
    const pr = makePr({ labels: ["ai-generated"] });
    expect(classifyPullRequest(pr, [], defaultConfig)).toBe("ai");
  });

  it("returns 'ai' when co-author matches", () => {
    const pr = makePr();
    const commits = [
      makeCommit(
        "Fix bug\n\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>",
      ),
    ];
    expect(classifyPullRequest(pr, commits, defaultConfig)).toBe("ai");
  });

  it("returns 'ai' when multiple heuristics all match", () => {
    const pr = makePr({
      author: "dependabot",
      branchName: "ai/update-deps",
      labels: ["bot"],
    });
    expect(classifyPullRequest(pr, [], defaultConfig)).toBe("ai");
  });

  it("returns 'ai' when any full AI signal matches even if others don't", () => {
    // author matches bot list, branch/label don't → still "ai"
    const pr = makePr({
      author: "dependabot",
      branchName: "feature/normal",
      labels: [],
    });
    expect(classifyPullRequest(pr, [], defaultConfig)).toBe("ai");
  });

  it("returns 'mixed' when only some commits have AI co-author", () => {
    const pr = makePr();
    const commits = [
      makeCommit("Human commit"),
      makeCommit("AI commit\n\nCo-Authored-By: Claude <noreply>"),
    ];
    // Only 1 of 2 commits has AI co-author → mixed
    expect(classifyPullRequest(pr, commits, defaultConfig)).toBe("mixed");
  });

  it("ignores disabled heuristics — does not count them as signals", () => {
    // Only authorBot enabled, and it matches → should be 'ai' not 'mixed'
    const config: AiHeuristicsConfig = {
      ...defaultConfig,
      enabled: {
        coAuthor: false,
        authorBot: true,
        branchName: false,
        label: false,
      },
    };
    const pr = makePr({ author: "dependabot" });
    expect(classifyPullRequest(pr, [], config)).toBe("ai");
  });

  it("returns 'human' when enabled heuristics don't match", () => {
    const config: AiHeuristicsConfig = {
      ...defaultConfig,
      enabled: {
        coAuthor: false,
        authorBot: true,
        branchName: false,
        label: false,
      },
    };
    const pr = makePr({ author: "human-dev" });
    expect(classifyPullRequest(pr, [], config)).toBe("human");
  });

  it("returns 'mixed' when co-author found in some but not all commits", () => {
    const pr = makePr();
    const commits = [
      makeCommit("Regular commit"),
      makeCommit("Another commit"),
      makeCommit("Last one\n\nCo-Authored-By: Copilot <noreply>"),
    ];
    // 1 of 3 commits has AI co-author → mixed
    expect(classifyPullRequest(pr, commits, defaultConfig)).toBe("mixed");
  });

  it("returns 'ai' when all commits have AI co-author", () => {
    const pr = makePr();
    const commits = [
      makeCommit("Fix\n\nCo-Authored-By: Claude <noreply>"),
      makeCommit("Update\n\nCo-Authored-By: Copilot <noreply>"),
    ];
    expect(classifyPullRequest(pr, commits, defaultConfig)).toBe("ai");
  });
});
