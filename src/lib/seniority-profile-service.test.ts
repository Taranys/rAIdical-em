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

import { computeSeniorityProfiles } from "./seniority-profile-service";
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

  it("clears existing profiles before recomputing", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([]);

    await computeSeniorityProfiles({ llmService: mockLLMService });

    expect(deleteAllProfiles).toHaveBeenCalled();
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
  });

  it("skips members with no classified comments", async () => {
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
    expect(upsertSeniorityProfile).not.toHaveBeenCalled();
    expect(mockLLMService.classify).not.toHaveBeenCalled();
  });

  it("computes technical language dimension from file paths", async () => {
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

    // Mock LLM for soft skills
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

    // Should have created a "typescript" technical dimension
    expect(upsertSeniorityProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        teamMemberId: 1,
        dimensionName: "typescript",
        dimensionFamily: "technical",
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
