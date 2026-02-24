// US-2.16: Reclassify comment API route tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/comment-classifications", () => ({
  updateClassification: vi.fn(),
}));

import { PUT } from "./route";
import { updateClassification } from "@/db/comment-classifications";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/review-quality/comments/review_comment/1/classify", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/review-quality/comments/[commentType]/[commentId]/classify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 and updates classification with valid category", async () => {
    vi.mocked(updateClassification).mockReturnValue({
      id: 1,
      commentType: "review_comment",
      commentId: 1,
      category: "security",
      confidence: 100,
      modelUsed: "manual",
      classificationRunId: null,
      classifiedAt: "2026-02-24T10:00:00Z",
      reasoning: null,
      isManual: 1,
    });

    const request = makeRequest({ category: "security" });
    const response = await PUT(request, {
      params: Promise.resolve({ commentType: "review_comment", commentId: "1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.classification.category).toBe("security");
    expect(updateClassification).toHaveBeenCalledWith("review_comment", 1, "security");
  });

  it("returns 400 for invalid category", async () => {
    const request = makeRequest({ category: "invalid_category" });
    const response = await PUT(request, {
      params: Promise.resolve({ commentType: "review_comment", commentId: "1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid category");
    expect(updateClassification).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid comment type", async () => {
    const request = makeRequest({ category: "security" });
    const response = await PUT(request, {
      params: Promise.resolve({ commentType: "invalid_type", commentId: "1" }),
    });

    expect(response.status).toBe(400);
    expect(updateClassification).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid comment ID", async () => {
    const request = makeRequest({ category: "security" });
    const response = await PUT(request, {
      params: Promise.resolve({ commentType: "review_comment", commentId: "abc" }),
    });

    expect(response.status).toBe(400);
    expect(updateClassification).not.toHaveBeenCalled();
  });

  it("returns 404 when classification not found", async () => {
    vi.mocked(updateClassification).mockReturnValue(undefined);

    const request = makeRequest({ category: "security" });
    const response = await PUT(request, {
      params: Promise.resolve({ commentType: "review_comment", commentId: "999" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("not found");
  });

  it("returns 400 for missing body", async () => {
    const request = new Request(
      "http://localhost/api/review-quality/comments/review_comment/1/classify",
      { method: "PUT" },
    );
    const response = await PUT(request, {
      params: Promise.resolve({ commentType: "review_comment", commentId: "1" }),
    });

    expect(response.status).toBe(400);
  });
});
