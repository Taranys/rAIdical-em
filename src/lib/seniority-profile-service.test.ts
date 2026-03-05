// US-2.10: Seniority profile service unit tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/llm", () => ({
  createLLMServiceFromSettings: vi.fn(),
}));

vi.mock("@/db/team-members", () => ({
  getAllTeamMembers: vi.fn(),
}));

vi.mock("@/db/comment-classifications", () => ({
  getClassifiedCommentsForProfile: vi.fn(),
  getCategoryDistributionByReviewer: vi.fn(),
}));

vi.mock("@/db/seniority-profiles", () => ({
  upsertSeniorityProfile: vi.fn(),
  deleteAllProfiles: vi.fn(),
}));

import {
  computeSeniorityProfiles,
  generateTechnicalRationale,
} from "./seniority-profile-service";
import { ALL_DEFINED_DIMENSION_NAMES } from "./seniority-dimensions";
import { getAllTeamMembers } from "@/db/team-members";
import {
  getClassifiedCommentsForProfile,
  getCategoryDistributionByReviewer,
} from "@/db/comment-classifications";
import {
  upsertSeniorityProfile,
  deleteAllProfiles,
} from "@/db/seniority-profiles";
import type { LLMService } from "@/lib/llm";

const mockLLMService: LLMService = {
  classify: vi.fn(),
};

describe("computeSeniorityProfiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns early without deleting profiles when no classified comments exist", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([
      {
        id: 1,
        githubUsername: "alice",
        displayName: "Alice",
        avatarUrl: null,
        color: "#E25A3B",
        isActive: 1,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);
    vi.mocked(getClassifiedCommentsForProfile).mockReturnValue([]);
    vi.mocked(getCategoryDistributionByReviewer).mockReturnValue([]);

    const result = await computeSeniorityProfiles({
      llmService: mockLLMService,
    });

    expect(result.status).toBe("success");
    expect(result.membersProcessed).toBe(0);
    expect(result.profilesGenerated).toBe(0);
    expect(result.errors).toBe(0);
    expect(deleteAllProfiles).not.toHaveBeenCalled();
    expect(upsertSeniorityProfile).not.toHaveBeenCalled();
    expect(mockLLMService.classify).not.toHaveBeenCalled();
  });

  it("deletes and recomputes profiles when classified comments are available", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([
      {
        id: 1,
        githubUsername: "alice",
        displayName: "Alice",
        avatarUrl: null,
        color: "#E25A3B",
        isActive: 1,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);
    vi.mocked(getClassifiedCommentsForProfile).mockReturnValue([
      { reviewer: "alice", filePath: "src/app.ts", category: "bug_correctness", confidence: 90, body: "Bug here", prTitle: "PR1" },
    ]);
    vi.mocked(getCategoryDistributionByReviewer).mockReturnValue([
      { reviewer: "alice", category: "bug_correctness", count: 1 },
    ]);
    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: JSON.stringify({
        scores: [
          { name: "pedagogy", score: 50, reasoning: "Ok" },
          { name: "cross_team_awareness", score: 50, reasoning: "Ok" },
          { name: "boldness", score: 50, reasoning: "Ok" },
          { name: "thoroughness", score: 50, reasoning: "Ok" },
        ],
      }),
    });

    const result = await computeSeniorityProfiles({
      llmService: mockLLMService,
    });

    expect(deleteAllProfiles).toHaveBeenCalled();
    expect(result.membersProcessed).toBe(1);
    expect(result.profilesGenerated).toBeGreaterThan(0);
    expect(upsertSeniorityProfile).toHaveBeenCalled();
  });

  it("returns success with zero counts when no team members exist", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([]);

    const result = await computeSeniorityProfiles({
      llmService: mockLLMService,
    });

    expect(result.status).toBe("success");
    expect(result.membersProcessed).toBe(0);
    expect(result.profilesGenerated).toBe(0);
    expect(result.errors).toBe(0);
    expect(deleteAllProfiles).not.toHaveBeenCalled();
  });

  it("does not generate per-language dimensions from file paths", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([
      {
        id: 1,
        githubUsername: "alice",
        displayName: "Alice",
        avatarUrl: null,
        color: "#E25A3B",
        isActive: 1,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);
    vi.mocked(getClassifiedCommentsForProfile).mockReturnValue([
      { reviewer: "alice", filePath: "src/app.ts", category: "bug_correctness", confidence: 90, body: "Bug here", prTitle: "PR1" },
      { reviewer: "alice", filePath: "src/utils.ts", category: "architecture_design", confidence: 85, body: "Design issue", prTitle: "PR2" },
      { reviewer: "alice", filePath: "src/lib.ts", category: "nitpick_style", confidence: 70, body: "Style", prTitle: "PR3" },
    ]);
    vi.mocked(getCategoryDistributionByReviewer).mockReturnValue([
      { reviewer: "alice", category: "bug_correctness", count: 1 },
      { reviewer: "alice", category: "architecture_design", count: 1 },
      { reviewer: "alice", category: "nitpick_style", count: 1 },
    ]);

    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: JSON.stringify({
        scores: [
          { name: "pedagogy", score: 50, reasoning: "Average explanations" },
          { name: "cross_team_awareness", score: 30, reasoning: "Limited" },
          { name: "boldness", score: 40, reasoning: "Some courage" },
          { name: "thoroughness", score: 60, reasoning: "Decent depth" },
        ],
      }),
    });

    const result = await computeSeniorityProfiles({
      llmService: mockLLMService,
    });

    expect(result.status).toBe("success");
    expect(result.membersProcessed).toBe(1);
    expect(result.profilesGenerated).toBeGreaterThan(0);

    // Should NOT have created a "typescript" language dimension
    expect(upsertSeniorityProfile).not.toHaveBeenCalledWith(
      expect.objectContaining({
        dimensionName: "typescript",
      }),
    );
  });

  it("computes technical category dimensions (security, architecture, etc.)", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([
      {
        id: 1,
        githubUsername: "alice",
        displayName: "Alice",
        avatarUrl: null,
        color: "#E25A3B",
        isActive: 1,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);
    vi.mocked(getClassifiedCommentsForProfile).mockReturnValue([
      { reviewer: "alice", filePath: "src/auth.ts", category: "security", confidence: 95, body: "SQL injection risk", prTitle: "PR1" },
      { reviewer: "alice", filePath: "src/auth.ts", category: "security", confidence: 88, body: "XSS vector", prTitle: "PR2" },
    ]);
    vi.mocked(getCategoryDistributionByReviewer).mockReturnValue([
      { reviewer: "alice", category: "security", count: 2 },
    ]);

    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: JSON.stringify({
        scores: [
          { name: "pedagogy", score: 40, reasoning: "Ok" },
          { name: "cross_team_awareness", score: 30, reasoning: "Limited" },
          { name: "boldness", score: 50, reasoning: "Ok" },
          { name: "thoroughness", score: 45, reasoning: "Ok" },
        ],
      }),
    });

    await computeSeniorityProfiles({ llmService: mockLLMService });

    // Should have a "security" technical dimension
    expect(upsertSeniorityProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        teamMemberId: 1,
        dimensionName: "security",
        dimensionFamily: "technical",
      }),
    );
  });

  it("computes soft skill dimensions via LLM", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([
      {
        id: 1,
        githubUsername: "alice",
        displayName: "Alice",
        avatarUrl: null,
        color: "#E25A3B",
        isActive: 1,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);
    vi.mocked(getClassifiedCommentsForProfile).mockReturnValue([
      { reviewer: "alice", filePath: "src/app.ts", category: "bug_correctness", confidence: 90, body: "This is a bug because X", prTitle: "PR" },
    ]);
    vi.mocked(getCategoryDistributionByReviewer).mockReturnValue([
      { reviewer: "alice", category: "bug_correctness", count: 1 },
    ]);

    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: JSON.stringify({
        scores: [
          { name: "pedagogy", score: 80, reasoning: "Excellent teacher" },
          { name: "cross_team_awareness", score: 20, reasoning: "Narrow focus" },
          { name: "boldness", score: 75, reasoning: "Challenges code well" },
          { name: "thoroughness", score: 90, reasoning: "Very thorough" },
        ],
      }),
    });

    await computeSeniorityProfiles({ llmService: mockLLMService });

    // Soft skill profiles should be created
    expect(upsertSeniorityProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        teamMemberId: 1,
        dimensionName: "pedagogy",
        dimensionFamily: "soft_skill",
        maturityLevel: "senior", // score 80 >= 70
      }),
    );
    expect(upsertSeniorityProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        teamMemberId: 1,
        dimensionName: "cross_team_awareness",
        dimensionFamily: "soft_skill",
        maturityLevel: "junior", // score 20 < 40
      }),
    );
    expect(upsertSeniorityProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        teamMemberId: 1,
        dimensionName: "boldness",
        dimensionFamily: "soft_skill",
        maturityLevel: "senior", // score 75 >= 70
      }),
    );
    expect(upsertSeniorityProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        teamMemberId: 1,
        dimensionName: "thoroughness",
        dimensionFamily: "soft_skill",
        maturityLevel: "senior", // score 90 >= 70
      }),
    );
  });

  it("only produces profiles with dimension names in ALL_DEFINED_DIMENSION_NAMES", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([
      {
        id: 1,
        githubUsername: "alice",
        displayName: "Alice",
        avatarUrl: null,
        color: "#E25A3B",
        isActive: 1,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);
    vi.mocked(getClassifiedCommentsForProfile).mockReturnValue([
      { reviewer: "alice", filePath: "src/app.ts", category: "security", confidence: 90, body: "XSS", prTitle: "PR1" },
      { reviewer: "alice", filePath: "src/utils.py", category: "architecture_design", confidence: 85, body: "Design", prTitle: "PR2" },
      { reviewer: "alice", filePath: "src/lib.rb", category: "performance", confidence: 80, body: "Slow", prTitle: "PR3" },
    ]);
    vi.mocked(getCategoryDistributionByReviewer).mockReturnValue([
      { reviewer: "alice", category: "security", count: 1 },
      { reviewer: "alice", category: "architecture_design", count: 1 },
      { reviewer: "alice", category: "performance", count: 1 },
    ]);

    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: JSON.stringify({
        scores: [
          { name: "pedagogy", score: 50, reasoning: "Ok" },
          { name: "cross_team_awareness", score: 50, reasoning: "Ok" },
          { name: "boldness", score: 50, reasoning: "Ok" },
          { name: "thoroughness", score: 50, reasoning: "Ok" },
        ],
      }),
    });

    await computeSeniorityProfiles({ llmService: mockLLMService });

    const calls = vi.mocked(upsertSeniorityProfile).mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    for (const [data] of calls) {
      expect(ALL_DEFINED_DIMENSION_NAMES.has(data.dimensionName)).toBe(true);
    }
  });

  it("handles LLM errors gracefully and continues to next member", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([
      {
        id: 1,
        githubUsername: "alice",
        displayName: "Alice",
        avatarUrl: null,
        color: "#E25A3B",
        isActive: 1,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: 2,
        githubUsername: "bob",
        displayName: "Bob",
        avatarUrl: null,
        color: "#3B82F6",
        isActive: 1,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);
    vi.mocked(getClassifiedCommentsForProfile).mockReturnValue([
      { reviewer: "alice", filePath: "src/a.ts", category: "bug_correctness", confidence: 90, body: "Bug", prTitle: "PR" },
      { reviewer: "bob", filePath: "src/b.ts", category: "bug_correctness", confidence: 90, body: "Bug", prTitle: "PR" },
    ]);
    vi.mocked(getCategoryDistributionByReviewer).mockReturnValue([
      { reviewer: "alice", category: "bug_correctness", count: 1 },
      { reviewer: "bob", category: "bug_correctness", count: 1 },
    ]);

    vi.mocked(mockLLMService.classify)
      .mockRejectedValueOnce(new Error("Rate limit"))
      .mockResolvedValueOnce({
        content: JSON.stringify({
          scores: [
            { name: "pedagogy", score: 50, reasoning: "Ok" },
            { name: "cross_team_awareness", score: 50, reasoning: "Ok" },
            { name: "boldness", score: 50, reasoning: "Ok" },
            { name: "thoroughness", score: 50, reasoning: "Ok" },
          ],
        }),
      });

    const result = await computeSeniorityProfiles({
      llmService: mockLLMService,
    });

    expect(result.errors).toBe(1);
    // Alice's technical profiles should still be created (LLM error only affects soft skills)
    // Bob should be fully processed
    expect(result.membersProcessed).toBe(2);
  });

  it("handles LLM parse errors for soft skills", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([
      {
        id: 1,
        githubUsername: "alice",
        displayName: "Alice",
        avatarUrl: null,
        color: "#E25A3B",
        isActive: 1,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);
    vi.mocked(getClassifiedCommentsForProfile).mockReturnValue([
      { reviewer: "alice", filePath: "src/a.ts", category: "security", confidence: 90, body: "Issue", prTitle: "PR" },
    ]);
    vi.mocked(getCategoryDistributionByReviewer).mockReturnValue([
      { reviewer: "alice", category: "security", count: 1 },
    ]);

    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: "not valid json at all",
    });

    const result = await computeSeniorityProfiles({
      llmService: mockLLMService,
    });

    expect(result.errors).toBe(1);
    // Technical profiles should still be created
    expect(result.membersProcessed).toBe(1);
  });

  it("returns error status when all members fail completely", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([
      {
        id: 1,
        githubUsername: "alice",
        displayName: "Alice",
        avatarUrl: null,
        color: "#E25A3B",
        isActive: 1,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);
    // Throw when fetching comments
    vi.mocked(getClassifiedCommentsForProfile).mockImplementation(() => {
      throw new Error("DB error");
    });

    const result = await computeSeniorityProfiles({
      llmService: mockLLMService,
    });

    expect(result.status).toBe("error");
    expect(result.errors).toBe(1);
  });
});

describe("maturity level derivation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("assigns senior level for high depth score + high volume + high ratio", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([
      {
        id: 1,
        githubUsername: "alice",
        displayName: "Alice",
        avatarUrl: null,
        color: "#E25A3B",
        isActive: 1,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);
    // 15 security comments — high volume, all high-value
    const comments = Array.from({ length: 15 }, (_, i) => ({
      reviewer: "alice",
      filePath: `src/auth${i}.ts`,
      category: "security",
      confidence: 90,
      body: `Security issue #${i}`,
      prTitle: "PR",
    }));
    vi.mocked(getClassifiedCommentsForProfile).mockReturnValue(comments);
    vi.mocked(getCategoryDistributionByReviewer).mockReturnValue([
      { reviewer: "alice", category: "security", count: 15 },
    ]);

    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: JSON.stringify({
        scores: [
          { name: "pedagogy", score: 50, reasoning: "Ok" },
          { name: "cross_team_awareness", score: 50, reasoning: "Ok" },
          { name: "boldness", score: 50, reasoning: "Ok" },
          { name: "thoroughness", score: 50, reasoning: "Ok" },
        ],
      }),
    });

    await computeSeniorityProfiles({ llmService: mockLLMService });

    expect(upsertSeniorityProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        dimensionName: "security",
        maturityLevel: "senior",
      }),
    );
  });

  it("assigns experienced level for moderate metrics", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([
      {
        id: 1,
        githubUsername: "alice",
        displayName: "Alice",
        avatarUrl: null,
        color: "#E25A3B",
        isActive: 1,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);
    // 10 comments: 5 security + 5 nitpick — security dim volume = 5 (meets experienced threshold)
    vi.mocked(getClassifiedCommentsForProfile).mockReturnValue([
      { reviewer: "alice", filePath: "src/a.ts", category: "security", confidence: 80, body: "Issue", prTitle: "PR" },
      { reviewer: "alice", filePath: "src/b.ts", category: "security", confidence: 75, body: "Issue", prTitle: "PR" },
      { reviewer: "alice", filePath: "src/c.ts", category: "security", confidence: 70, body: "Issue", prTitle: "PR" },
      { reviewer: "alice", filePath: "src/d.ts", category: "security", confidence: 70, body: "Issue", prTitle: "PR" },
      { reviewer: "alice", filePath: "src/e.ts", category: "security", confidence: 70, body: "Issue", prTitle: "PR" },
      { reviewer: "alice", filePath: "src/f.ts", category: "nitpick_style", confidence: 80, body: "Style", prTitle: "PR" },
      { reviewer: "alice", filePath: "src/g.ts", category: "nitpick_style", confidence: 80, body: "Style", prTitle: "PR" },
      { reviewer: "alice", filePath: "src/h.ts", category: "nitpick_style", confidence: 80, body: "Style", prTitle: "PR" },
      { reviewer: "alice", filePath: "src/i.ts", category: "nitpick_style", confidence: 80, body: "Style", prTitle: "PR" },
      { reviewer: "alice", filePath: "src/j.ts", category: "nitpick_style", confidence: 80, body: "Style", prTitle: "PR" },
    ]);
    vi.mocked(getCategoryDistributionByReviewer).mockReturnValue([
      { reviewer: "alice", category: "security", count: 5 },
      { reviewer: "alice", category: "nitpick_style", count: 5 },
    ]);

    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: JSON.stringify({
        scores: [
          { name: "pedagogy", score: 50, reasoning: "Ok" },
          { name: "cross_team_awareness", score: 50, reasoning: "Ok" },
          { name: "boldness", score: 50, reasoning: "Ok" },
          { name: "thoroughness", score: 50, reasoning: "Ok" },
        ],
      }),
    });

    await computeSeniorityProfiles({ llmService: mockLLMService });

    // Security dimension: volume=5 (>= 5), overall depth = (5*90 + 5*10)/10 = 50 (>= 40)
    // high-value ratio = 5/10 = 0.5 — meets experienced thresholds
    expect(upsertSeniorityProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        dimensionName: "security",
        maturityLevel: "experienced",
      }),
    );
  });
});

describe("generateTechnicalRationale", () => {
  it("generates senior rationale with all thresholds met", () => {
    const rationale = generateTechnicalRationale(
      { depthScore: 78, volume: 15, highValueRatio: 0.45 },
      "senior",
    );
    expect(rationale).toContain("depth score 78/100 (≥70)");
    expect(rationale).toContain("15 comments (≥10)");
    expect(rationale).toContain("45% high-value ratio (≥40%)");
    expect(rationale).toContain("all senior thresholds met");
  });

  it("generates experienced rationale with missing senior criteria", () => {
    const rationale = generateTechnicalRationale(
      { depthScore: 52, volume: 7, highValueRatio: 0.2 },
      "experienced",
    );
    expect(rationale).toContain("depth score 52/100 (≥40)");
    expect(rationale).toContain("7 comments (≥5)");
    expect(rationale).toContain("meet experienced level");
    expect(rationale).toContain("Missing senior:");
    expect(rationale).toContain("high-value ratio 20% (<40%)");
  });

  it("generates junior rationale with failed experienced thresholds", () => {
    const rationale = generateTechnicalRationale(
      { depthScore: 25, volume: 3, highValueRatio: 0.1 },
      "junior",
    );
    expect(rationale).toContain("depth score 25/100 (<40)");
    expect(rationale).toContain("3 comments (<5)");
    expect(rationale).toContain("below experienced thresholds");
  });

  it("includes dimension label when provided", () => {
    const rationale = generateTechnicalRationale(
      { depthScore: 55, volume: 8, highValueRatio: 0.25 },
      "experienced",
      "TypeScript",
    );
    expect(rationale).toMatch(/^TypeScript — /);
  });

  it("omits dimension label when not provided", () => {
    const rationale = generateTechnicalRationale(
      { depthScore: 78, volume: 15, highValueRatio: 0.45 },
      "senior",
    );
    expect(rationale).toMatch(/^depth score/);
  });

  it("handles boundary values at experienced threshold", () => {
    const rationale = generateTechnicalRationale(
      { depthScore: 40, volume: 5, highValueRatio: 0.1 },
      "experienced",
    );
    expect(rationale).toContain("meet experienced level");
    expect(rationale).toContain("Missing senior:");
  });

  it("handles boundary values at senior threshold", () => {
    const rationale = generateTechnicalRationale(
      { depthScore: 70, volume: 10, highValueRatio: 0.4 },
      "senior",
    );
    expect(rationale).toContain("all senior thresholds met");
  });
});

describe("rationale included in all profile computations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("every upsertSeniorityProfile call includes a rationale string in supportingMetrics", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([
      {
        id: 1,
        githubUsername: "alice",
        displayName: "Alice",
        avatarUrl: null,
        color: "#E25A3B",
        isActive: 1,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);
    vi.mocked(getClassifiedCommentsForProfile).mockReturnValue([
      { reviewer: "alice", filePath: "src/app.ts", category: "bug_correctness", confidence: 90, body: "Bug", prTitle: "PR1" },
      { reviewer: "alice", filePath: "src/auth.ts", category: "security", confidence: 85, body: "XSS", prTitle: "PR2" },
      { reviewer: "alice", filePath: "src/perf.ts", category: "performance", confidence: 80, body: "Perf", prTitle: "PR3" },
    ]);
    vi.mocked(getCategoryDistributionByReviewer).mockReturnValue([
      { reviewer: "alice", category: "bug_correctness", count: 1 },
      { reviewer: "alice", category: "security", count: 1 },
      { reviewer: "alice", category: "performance", count: 1 },
    ]);
    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: JSON.stringify({
        scores: [
          { name: "pedagogy", score: 60, reasoning: "Good teacher" },
          { name: "cross_team_awareness", score: 45, reasoning: "Some awareness" },
          { name: "boldness", score: 30, reasoning: "" },
          { name: "thoroughness", score: 80, reasoning: "Very thorough" },
        ],
      }),
    });

    await computeSeniorityProfiles({ llmService: mockLLMService });

    const calls = vi.mocked(upsertSeniorityProfile).mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    for (const [data] of calls) {
      expect(data.supportingMetrics).toHaveProperty("rationale");
      expect(typeof data.supportingMetrics.rationale).toBe("string");
      expect((data.supportingMetrics.rationale as string).length).toBeGreaterThan(0);
    }
  });

  it("soft skill rationale uses LLM reasoning as passthrough", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([
      {
        id: 1,
        githubUsername: "alice",
        displayName: "Alice",
        avatarUrl: null,
        color: "#E25A3B",
        isActive: 1,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);
    vi.mocked(getClassifiedCommentsForProfile).mockReturnValue([
      { reviewer: "alice", filePath: "src/app.ts", category: "bug_correctness", confidence: 90, body: "Bug", prTitle: "PR" },
    ]);
    vi.mocked(getCategoryDistributionByReviewer).mockReturnValue([
      { reviewer: "alice", category: "bug_correctness", count: 1 },
    ]);
    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: JSON.stringify({
        scores: [
          { name: "pedagogy", score: 50, reasoning: "Average explanations" },
          { name: "cross_team_awareness", score: 30, reasoning: "Narrow focus" },
          { name: "boldness", score: 75, reasoning: "Challenges well" },
          { name: "thoroughness", score: 90, reasoning: "Very thorough reviewer" },
        ],
      }),
    });

    await computeSeniorityProfiles({ llmService: mockLLMService });

    const calls = vi.mocked(upsertSeniorityProfile).mock.calls;
    const softSkillCalls = calls.filter(([d]) => d.dimensionFamily === "soft_skill");

    // boldness: has reasoning → passthrough
    const boldness = softSkillCalls.find(([d]) => d.dimensionName === "boldness");
    expect(boldness).toBeDefined();
    expect(boldness![0].supportingMetrics.rationale).toBe("Challenges well");

    // pedagogy: has reasoning → passthrough
    const pedagogy = softSkillCalls.find(([d]) => d.dimensionName === "pedagogy");
    expect(pedagogy).toBeDefined();
    expect(pedagogy![0].supportingMetrics.rationale).toBe("Average explanations");
  });
});
