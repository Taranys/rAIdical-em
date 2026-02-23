// US-2.05: Batch classification service unit tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/settings", () => ({
  getSetting: vi.fn(),
}));

vi.mock("@/lib/llm", () => ({
  createLLMServiceFromSettings: vi.fn(),
}));

vi.mock("@/db/classification-runs", () => ({
  createClassificationRun: vi.fn(),
  updateClassificationRunProgress: vi.fn(),
  completeClassificationRun: vi.fn(),
}));

vi.mock("@/db/comment-classifications", () => ({
  getUnclassifiedReviewComments: vi.fn(),
  getUnclassifiedPrComments: vi.fn(),
  insertClassification: vi.fn(),
  getClassificationSummary: vi.fn(),
}));

import { classifyComments } from "./classification-service";
import { getSetting } from "@/db/settings";
import {
  createClassificationRun,
  updateClassificationRunProgress,
  completeClassificationRun,
} from "@/db/classification-runs";
import {
  getUnclassifiedReviewComments,
  getUnclassifiedPrComments,
  insertClassification,
  getClassificationSummary,
} from "@/db/comment-classifications";
import type { LLMService } from "@/lib/llm";

const mockLLMService: LLMService = {
  classify: vi.fn(),
};

function setupDefaults() {
  vi.mocked(getSetting).mockReturnValue("test-model");
  vi.mocked(createClassificationRun).mockReturnValue({
    id: 1,
    startedAt: "2026-02-23T10:00:00Z",
    completedAt: null,
    status: "running",
    commentsProcessed: 0,
    errors: 0,
    modelUsed: "test-model",
  });
  vi.mocked(getClassificationSummary).mockReturnValue({
    categories: [],
    totalClassified: 0,
    averageConfidence: 0,
  });
}

describe("classifyComments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns early with success when no unclassified comments exist", async () => {
    vi.mocked(getUnclassifiedReviewComments).mockReturnValue([]);
    vi.mocked(getUnclassifiedPrComments).mockReturnValue([]);

    const result = await classifyComments({ llmService: mockLLMService });

    expect(result.status).toBe("success");
    expect(result.totalComments).toBe(0);
    expect(result.commentsProcessed).toBe(0);
    expect(completeClassificationRun).toHaveBeenCalledWith(1, "success", 0, 0);
  });

  it("classifies review comments and pr comments", async () => {
    vi.mocked(getUnclassifiedReviewComments).mockReturnValue([
      {
        commentType: "review_comment",
        commentId: 10,
        body: "This could cause a null pointer",
        filePath: "src/index.ts",
        prTitle: "Add feature",
      },
    ]);
    vi.mocked(getUnclassifiedPrComments).mockReturnValue([
      {
        commentType: "pr_comment",
        commentId: 20,
        body: "LGTM",
        filePath: null,
        prTitle: "Fix bug",
      },
    ]);

    vi.mocked(mockLLMService.classify)
      .mockResolvedValueOnce({
        content: JSON.stringify({
          category: "bug_correctness",
          confidence: 0.9,
          reasoning: "Points out a null pointer issue",
        }),
      })
      .mockResolvedValueOnce({
        content: JSON.stringify({
          category: "question_clarification",
          confidence: 0.2,
          reasoning: "Short approval comment",
        }),
      });

    vi.mocked(getClassificationSummary).mockReturnValue({
      categories: [
        { category: "bug_correctness", count: 1 },
        { category: "question_clarification", count: 1 },
      ],
      totalClassified: 2,
      averageConfidence: 55,
    });

    const result = await classifyComments({ llmService: mockLLMService });

    expect(result.status).toBe("success");
    expect(result.commentsProcessed).toBe(2);
    expect(result.totalComments).toBe(2);
    expect(result.errors).toBe(0);
    expect(insertClassification).toHaveBeenCalledTimes(2);
    expect(insertClassification).toHaveBeenCalledWith(
      expect.objectContaining({
        commentType: "review_comment",
        commentId: 10,
        category: "bug_correctness",
        confidence: 90,
        reasoning: "Points out a null pointer issue",
      }),
    );
    expect(insertClassification).toHaveBeenCalledWith(
      expect.objectContaining({
        commentType: "pr_comment",
        commentId: 20,
        category: "question_clarification",
        confidence: 20,
        reasoning: "Short approval comment",
      }),
    );
  });

  it("handles LLM errors gracefully and continues processing", async () => {
    vi.mocked(getUnclassifiedReviewComments).mockReturnValue([
      {
        commentType: "review_comment",
        commentId: 10,
        body: "Comment 1",
        filePath: null,
        prTitle: "PR 1",
      },
      {
        commentType: "review_comment",
        commentId: 11,
        body: "Comment 2",
        filePath: null,
        prTitle: "PR 1",
      },
    ]);
    vi.mocked(getUnclassifiedPrComments).mockReturnValue([]);

    vi.mocked(mockLLMService.classify)
      .mockRejectedValueOnce(new Error("Rate limit exceeded"))
      .mockResolvedValueOnce({
        content: JSON.stringify({
          category: "nitpick_style",
          confidence: 0.7,
          reasoning: "Style suggestion",
        }),
      });

    vi.mocked(getClassificationSummary).mockReturnValue({
      categories: [{ category: "nitpick_style", count: 1 }],
      totalClassified: 1,
      averageConfidence: 70,
    });

    const result = await classifyComments({ llmService: mockLLMService });

    expect(result.status).toBe("success");
    expect(result.commentsProcessed).toBe(1);
    expect(result.errors).toBe(1);
    expect(insertClassification).toHaveBeenCalledTimes(1);
  });

  it("handles LLM parse errors and counts them as errors", async () => {
    vi.mocked(getUnclassifiedReviewComments).mockReturnValue([
      {
        commentType: "review_comment",
        commentId: 10,
        body: "Some comment",
        filePath: null,
        prTitle: "PR 1",
      },
    ]);
    vi.mocked(getUnclassifiedPrComments).mockReturnValue([]);

    vi.mocked(mockLLMService.classify).mockResolvedValueOnce({
      content: "not valid json at all",
    });

    const result = await classifyComments({ llmService: mockLLMService });

    expect(result.status).toBe("error");
    expect(result.commentsProcessed).toBe(0);
    expect(result.errors).toBe(1);
    expect(insertClassification).not.toHaveBeenCalled();
  });

  it("processes in configurable batch size and updates progress", async () => {
    const comments = Array.from({ length: 5 }, (_, i) => ({
      commentType: "review_comment" as const,
      commentId: i + 1,
      body: `Comment ${i + 1}`,
      filePath: null,
      prTitle: "PR",
    }));

    vi.mocked(getUnclassifiedReviewComments).mockReturnValue(comments);
    vi.mocked(getUnclassifiedPrComments).mockReturnValue([]);

    vi.mocked(mockLLMService.classify).mockResolvedValue({
      content: JSON.stringify({
        category: "nitpick_style",
        confidence: 0.5,
        reasoning: "Style",
      }),
    });

    vi.mocked(getClassificationSummary).mockReturnValue({
      categories: [{ category: "nitpick_style", count: 5 }],
      totalClassified: 5,
      averageConfidence: 50,
    });

    await classifyComments({ batchSize: 2, llmService: mockLLMService });

    // 5 comments with batchSize 2 = 3 batches (2 + 2 + 1)
    expect(updateClassificationRunProgress).toHaveBeenCalledTimes(3);
    expect(completeClassificationRun).toHaveBeenCalledWith(1, "success", 5, 0);
  });

  it("returns error status when all comments fail", async () => {
    vi.mocked(getUnclassifiedReviewComments).mockReturnValue([
      {
        commentType: "review_comment",
        commentId: 10,
        body: "Comment",
        filePath: null,
        prTitle: "PR",
      },
    ]);
    vi.mocked(getUnclassifiedPrComments).mockReturnValue([]);

    vi.mocked(mockLLMService.classify).mockRejectedValue(
      new Error("LLM down"),
    );

    vi.mocked(getClassificationSummary).mockReturnValue({
      categories: [],
      totalClassified: 0,
      averageConfidence: 0,
    });

    const result = await classifyComments({ llmService: mockLLMService });

    expect(result.status).toBe("error");
    expect(result.commentsProcessed).toBe(0);
    expect(result.errors).toBe(1);
    expect(completeClassificationRun).toHaveBeenCalledWith(1, "error", 0, 1);
  });
});
