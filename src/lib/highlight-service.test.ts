// US-2.12: Highlight service unit tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/llm", () => ({
  createLLMServiceFromSettings: vi.fn(),
}));

vi.mock("@/db/team-members", () => ({
  getAllTeamMembers: vi.fn(),
}));

vi.mock("@/db/comment-classifications", () => ({
  getTopClassifiedCommentsByMember: vi.fn(),
}));

vi.mock("@/db/highlights", () => ({
  insertHighlight: vi.fn(),
  deleteAllHighlightsByType: vi.fn(),
}));

import { generateBestCommentHighlights } from "./highlight-service";
import { getAllTeamMembers } from "@/db/team-members";
import { getTopClassifiedCommentsByMember } from "@/db/comment-classifications";
import {
  insertHighlight,
  deleteAllHighlightsByType,
} from "@/db/highlights";
import type { LLMService } from "@/lib/llm";

const mockLLMService: LLMService = {
  classify: vi.fn(),
};

describe("generateBestCommentHighlights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears existing best_comment highlights before regenerating", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([]);

    await generateBestCommentHighlights({ llmService: mockLLMService });

    expect(deleteAllHighlightsByType).toHaveBeenCalledWith("best_comment");
  });

  it("returns success with zero counts when no team members exist", async () => {
    vi.mocked(getAllTeamMembers).mockReturnValue([]);

    const result = await generateBestCommentHighlights({
      llmService: mockLLMService,
    });

    expect(result.status).toBe("success");
    expect(result.teamMembersProcessed).toBe(0);
    expect(result.highlightsGenerated).toBe(0);
    expect(result.errors).toBe(0);
  });

  it("skips members with no high-value comments", async () => {
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
    vi.mocked(getTopClassifiedCommentsByMember).mockReturnValue([]);

    const result = await generateBestCommentHighlights({
      llmService: mockLLMService,
    });

    expect(result.status).toBe("success");
    expect(result.teamMembersProcessed).toBe(0);
    expect(mockLLMService.classify).not.toHaveBeenCalled();
  });

  it("calls LLM for each member with top comments and stores highlights", async () => {
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
    vi.mocked(getTopClassifiedCommentsByMember).mockReturnValue([
      {
        commentType: "review_comment",
        commentId: 10,
        category: "bug_correctness",
        confidence: 90,
        body: "Null pointer bug here",
        filePath: "src/app.ts",
        prTitle: "Add feature",
      },
      {
        commentType: "review_comment",
        commentId: 11,
        category: "security",
        confidence: 85,
        body: "SQL injection risk",
        filePath: "src/db.ts",
        prTitle: "Add search",
      },
    ]);

    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: JSON.stringify({
        selections: [
          {
            commentId: 10,
            commentType: "review_comment",
            reasoning: "Excellent bug catch with clear explanation",
          },
          {
            commentId: 11,
            commentType: "review_comment",
            reasoning: "Important security finding",
          },
        ],
      }),
    });

    const result = await generateBestCommentHighlights({
      llmService: mockLLMService,
    });

    expect(result.status).toBe("success");
    expect(result.teamMembersProcessed).toBe(1);
    expect(result.highlightsGenerated).toBe(2);
    expect(result.errors).toBe(0);
    expect(insertHighlight).toHaveBeenCalledTimes(2);
    expect(insertHighlight).toHaveBeenCalledWith(
      expect.objectContaining({
        commentType: "review_comment",
        commentId: 10,
        highlightType: "best_comment",
        reasoning: "Excellent bug catch with clear explanation",
        teamMemberId: 1,
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
    vi.mocked(getTopClassifiedCommentsByMember).mockReturnValue([
      {
        commentType: "review_comment",
        commentId: 10,
        category: "bug_correctness",
        confidence: 90,
        body: "Bug here",
        filePath: null,
        prTitle: "PR",
      },
    ]);

    vi.mocked(mockLLMService.classify)
      .mockRejectedValueOnce(new Error("Rate limit"))
      .mockResolvedValueOnce({
        content: JSON.stringify({
          selections: [
            {
              commentId: 10,
              commentType: "review_comment",
              reasoning: "Good catch",
            },
          ],
        }),
      });

    const result = await generateBestCommentHighlights({
      llmService: mockLLMService,
    });

    expect(result.status).toBe("success");
    expect(result.teamMembersProcessed).toBe(1);
    expect(result.highlightsGenerated).toBe(1);
    expect(result.errors).toBe(1);
  });

  it("handles parse errors and counts them", async () => {
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
    vi.mocked(getTopClassifiedCommentsByMember).mockReturnValue([
      {
        commentType: "review_comment",
        commentId: 10,
        category: "bug_correctness",
        confidence: 90,
        body: "Bug",
        filePath: null,
        prTitle: "PR",
      },
    ]);

    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: "not valid json",
    });

    const result = await generateBestCommentHighlights({
      llmService: mockLLMService,
    });

    expect(result.errors).toBe(1);
    expect(result.highlightsGenerated).toBe(0);
    expect(insertHighlight).not.toHaveBeenCalled();
  });

  it("skips hallucinated comment IDs from LLM response", async () => {
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
    vi.mocked(getTopClassifiedCommentsByMember).mockReturnValue([
      {
        commentType: "review_comment",
        commentId: 10,
        category: "bug_correctness",
        confidence: 90,
        body: "Bug",
        filePath: null,
        prTitle: "PR",
      },
    ]);

    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: JSON.stringify({
        selections: [
          {
            commentId: 10,
            commentType: "review_comment",
            reasoning: "Valid selection",
          },
          {
            commentId: 999,
            commentType: "review_comment",
            reasoning: "Hallucinated ID",
          },
        ],
      }),
    });

    const result = await generateBestCommentHighlights({
      llmService: mockLLMService,
    });

    expect(result.highlightsGenerated).toBe(1);
    expect(insertHighlight).toHaveBeenCalledTimes(1);
    expect(insertHighlight).toHaveBeenCalledWith(
      expect.objectContaining({ commentId: 10 }),
    );
  });

  it("returns error status when all members fail", async () => {
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
    vi.mocked(getTopClassifiedCommentsByMember).mockReturnValue([
      {
        commentType: "review_comment",
        commentId: 10,
        category: "bug_correctness",
        confidence: 90,
        body: "Bug",
        filePath: null,
        prTitle: "PR",
      },
    ]);

    vi.mocked(mockLLMService.classify).mockRejectedValue(
      new Error("LLM down"),
    );

    const result = await generateBestCommentHighlights({
      llmService: mockLLMService,
    });

    expect(result.status).toBe("error");
    expect(result.errors).toBe(1);
    expect(result.highlightsGenerated).toBe(0);
  });

  it("passes minConfidence option to the query", async () => {
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
    vi.mocked(getTopClassifiedCommentsByMember).mockReturnValue([]);

    await generateBestCommentHighlights({
      llmService: mockLLMService,
      minConfidence: 85,
    });

    expect(getTopClassifiedCommentsByMember).toHaveBeenCalledWith(1, 85);
  });
});
