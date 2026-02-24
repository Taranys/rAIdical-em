// US-2.13: Growth opportunity service unit tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/llm", () => ({
  createLLMServiceFromSettings: vi.fn(),
}));

vi.mock("@/db/team-members", () => ({
  getAllTeamMembers: vi.fn(),
}));

vi.mock("@/db/comment-classifications", () => ({
  getLowDepthCommentsByMember: vi.fn(),
}));

vi.mock("@/db/highlights", () => ({
  insertHighlight: vi.fn(),
  deleteAllHighlightsByType: vi.fn(),
}));

import { generateGrowthOpportunities } from "./growth-service";
import { getAllTeamMembers } from "@/db/team-members";
import { getLowDepthCommentsByMember } from "@/db/comment-classifications";
import {
  insertHighlight,
  deleteAllHighlightsByType,
} from "@/db/highlights";
import type { LLMService } from "@/lib/llm";

const mockLLMService: LLMService = {
  classify: vi.fn(),
};

const TEAM_MEMBER_ALICE = {
  id: 1,
  githubUsername: "alice",
  displayName: "Alice",
  avatarUrl: null,
  color: "#E25A3B",
  isActive: 1,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

const TEAM_MEMBER_BOB = {
  id: 2,
  githubUsername: "bob",
  displayName: "Bob",
  avatarUrl: null,
  color: "#3B82F6",
  isActive: 1,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

describe("generateGrowthOpportunities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears existing growth_opportunity highlights before regenerating", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([]);

    await generateGrowthOpportunities({ llmService: mockLLMService });

    expect(deleteAllHighlightsByType).toHaveBeenCalledWith(
      "growth_opportunity",
    );
  });

  it("returns success with zero counts when no team members exist", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([]);

    const result = await generateGrowthOpportunities({
      llmService: mockLLMService,
    });

    expect(result.status).toBe("success");
    expect(result.teamMembersProcessed).toBe(0);
    expect(result.opportunitiesGenerated).toBe(0);
    expect(result.errors).toBe(0);
  });

  it("skips members with no low-depth comments", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([TEAM_MEMBER_ALICE]);
    vi.mocked(getLowDepthCommentsByMember).mockReturnValue([]);

    const result = await generateGrowthOpportunities({
      llmService: mockLLMService,
    });

    expect(result.status).toBe("success");
    expect(result.teamMembersProcessed).toBe(0);
    expect(mockLLMService.classify).not.toHaveBeenCalled();
  });

  it("calls LLM for each member with low-depth comments and stores opportunities", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([TEAM_MEMBER_ALICE]);
    vi.mocked(getLowDepthCommentsByMember).mockReturnValue([
      {
        commentType: "review_comment",
        commentId: 10,
        category: "nitpick_style",
        confidence: 80,
        body: "Missing semicolon",
        filePath: "src/app.ts",
        prTitle: "Add feature",
        prId: 1,
        prHadHighValueIssues: true,
      },
      {
        commentType: "review_comment",
        commentId: 11,
        category: "question_clarification",
        confidence: 65,
        body: "What does this do?",
        filePath: "src/utils.ts",
        prTitle: "Add search",
        prId: 2,
        prHadHighValueIssues: false,
      },
    ]);

    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: JSON.stringify({
        opportunities: [
          {
            commentId: 10,
            commentType: "review_comment",
            suggestion:
              "Instead of focusing on the semicolon, review the null safety of this code path.",
          },
        ],
      }),
    });

    const result = await generateGrowthOpportunities({
      llmService: mockLLMService,
    });

    expect(result.status).toBe("success");
    expect(result.teamMembersProcessed).toBe(1);
    expect(result.opportunitiesGenerated).toBe(1);
    expect(result.errors).toBe(0);
    expect(insertHighlight).toHaveBeenCalledTimes(1);
    expect(insertHighlight).toHaveBeenCalledWith(
      expect.objectContaining({
        commentType: "review_comment",
        commentId: 10,
        highlightType: "growth_opportunity",
        reasoning:
          "Instead of focusing on the semicolon, review the null safety of this code path.",
        teamMemberId: 1,
      }),
    );
  });

  it("validates comment IDs against input (anti-hallucination)", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([TEAM_MEMBER_ALICE]);
    vi.mocked(getLowDepthCommentsByMember).mockReturnValue([
      {
        commentType: "review_comment",
        commentId: 10,
        category: "nitpick_style",
        confidence: 80,
        body: "Nitpick",
        filePath: null,
        prTitle: "PR",
        prId: 1,
        prHadHighValueIssues: false,
      },
    ]);

    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: JSON.stringify({
        opportunities: [
          {
            commentId: 10,
            commentType: "review_comment",
            suggestion: "Valid suggestion",
          },
          {
            commentId: 999,
            commentType: "review_comment",
            suggestion: "Hallucinated ID",
          },
        ],
      }),
    });

    const result = await generateGrowthOpportunities({
      llmService: mockLLMService,
    });

    expect(result.opportunitiesGenerated).toBe(1);
    expect(insertHighlight).toHaveBeenCalledTimes(1);
    expect(insertHighlight).toHaveBeenCalledWith(
      expect.objectContaining({ commentId: 10 }),
    );
  });

  it("handles LLM errors gracefully and continues to next member", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([
      TEAM_MEMBER_ALICE,
      TEAM_MEMBER_BOB,
    ]);
    vi.mocked(getLowDepthCommentsByMember).mockReturnValue([
      {
        commentType: "review_comment",
        commentId: 10,
        category: "nitpick_style",
        confidence: 80,
        body: "Nitpick",
        filePath: null,
        prTitle: "PR",
        prId: 1,
        prHadHighValueIssues: false,
      },
    ]);

    vi.mocked(mockLLMService.classify)
      .mockRejectedValueOnce(new Error("Rate limit"))
      .mockResolvedValueOnce({
        content: JSON.stringify({
          opportunities: [
            {
              commentId: 10,
              commentType: "review_comment",
              suggestion: "Go deeper",
            },
          ],
        }),
      });

    const result = await generateGrowthOpportunities({
      llmService: mockLLMService,
    });

    expect(result.status).toBe("success");
    expect(result.teamMembersProcessed).toBe(1);
    expect(result.opportunitiesGenerated).toBe(1);
    expect(result.errors).toBe(1);
  });

  it("handles parse errors and counts them", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([TEAM_MEMBER_ALICE]);
    vi.mocked(getLowDepthCommentsByMember).mockReturnValue([
      {
        commentType: "review_comment",
        commentId: 10,
        category: "nitpick_style",
        confidence: 80,
        body: "Nitpick",
        filePath: null,
        prTitle: "PR",
        prId: 1,
        prHadHighValueIssues: false,
      },
    ]);

    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: "not valid json",
    });

    const result = await generateGrowthOpportunities({
      llmService: mockLLMService,
    });

    expect(result.errors).toBe(1);
    expect(result.opportunitiesGenerated).toBe(0);
    expect(insertHighlight).not.toHaveBeenCalled();
  });

  it("returns error status when all members fail", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([TEAM_MEMBER_ALICE]);
    vi.mocked(getLowDepthCommentsByMember).mockReturnValue([
      {
        commentType: "review_comment",
        commentId: 10,
        category: "nitpick_style",
        confidence: 80,
        body: "Nitpick",
        filePath: null,
        prTitle: "PR",
        prId: 1,
        prHadHighValueIssues: false,
      },
    ]);

    vi.mocked(mockLLMService.classify).mockRejectedValue(
      new Error("LLM down"),
    );

    const result = await generateGrowthOpportunities({
      llmService: mockLLMService,
    });

    expect(result.status).toBe("error");
    expect(result.errors).toBe(1);
    expect(result.opportunitiesGenerated).toBe(0);
  });

  it("passes minConfidence option to the query", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([TEAM_MEMBER_ALICE]);
    vi.mocked(getLowDepthCommentsByMember).mockReturnValue([]);

    await generateGrowthOpportunities({
      llmService: mockLLMService,
      minConfidence: 60,
    });

    expect(getLowDepthCommentsByMember).toHaveBeenCalledWith(1, 60);
  });

  it("stores highlightType as growth_opportunity", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([TEAM_MEMBER_ALICE]);
    vi.mocked(getLowDepthCommentsByMember).mockReturnValue([
      {
        commentType: "review_comment",
        commentId: 10,
        category: "nitpick_style",
        confidence: 80,
        body: "Nitpick",
        filePath: null,
        prTitle: "PR",
        prId: 1,
        prHadHighValueIssues: false,
      },
    ]);

    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: JSON.stringify({
        opportunities: [
          {
            commentId: 10,
            commentType: "review_comment",
            suggestion: "Go deeper here",
          },
        ],
      }),
    });

    await generateGrowthOpportunities({ llmService: mockLLMService });

    expect(insertHighlight).toHaveBeenCalledWith(
      expect.objectContaining({
        highlightType: "growth_opportunity",
      }),
    );
  });

  it("handles empty opportunities array from LLM", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([TEAM_MEMBER_ALICE]);
    vi.mocked(getLowDepthCommentsByMember).mockReturnValue([
      {
        commentType: "review_comment",
        commentId: 10,
        category: "nitpick_style",
        confidence: 80,
        body: "Nitpick",
        filePath: null,
        prTitle: "PR",
        prId: 1,
        prHadHighValueIssues: false,
      },
    ]);

    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: JSON.stringify({ opportunities: [] }),
    });

    const result = await generateGrowthOpportunities({
      llmService: mockLLMService,
    });

    expect(result.status).toBe("success");
    expect(result.teamMembersProcessed).toBe(1);
    expect(result.opportunitiesGenerated).toBe(0);
    expect(insertHighlight).not.toHaveBeenCalled();
  });
});
