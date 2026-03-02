// US-2.07: Review quality comments API route tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/comment-classifications", () => ({
  getClassifiedComments: vi.fn(),
}));

import { GET } from "./route";
import { getClassifiedComments } from "@/db/comment-classifications";

describe("GET /api/review-quality/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns comments with default sort (date desc)", async () => {
    vi.mocked(getClassifiedComments).mockReturnValue({
      comments: [
        {
          commentType: "review_comment",
          commentId: 1,
          reviewer: "bob",
          body: "Fix this",
          filePath: "src/app.ts",
          createdAt: "2026-02-02T10:00:00Z",
          prTitle: "Add feature",
          prNumber: 1,
          category: "bug_correctness",
          confidence: 90,
          reasoning: "Bug found",
          classifiedAt: "2026-02-23T10:00:00Z",
          isManual: false,
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 20,
    });

    const request = new Request("http://localhost/api/review-quality/comments");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.comments).toHaveLength(1);
    expect(data.totalCount).toBe(1);
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(20);
    expect(getClassifiedComments).toHaveBeenCalledWith(
      {
        category: undefined,
        reviewer: undefined,
        dateStart: undefined,
        dateEnd: undefined,
        minConfidence: undefined,
      },
      { sortBy: "date", sortOrder: "desc" },
      { page: undefined, pageSize: undefined },
    );
  });

  it("forwards filter query params to DAL", async () => {
    vi.mocked(getClassifiedComments).mockReturnValue({
      comments: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
    });

    const url =
      "http://localhost/api/review-quality/comments?category=security&reviewer=bob&dateStart=2026-01-01&dateEnd=2026-02-01&minConfidence=50";
    const request = new Request(url);
    await GET(request);

    expect(getClassifiedComments).toHaveBeenCalledWith(
      {
        category: "security",
        reviewer: "bob",
        dateStart: "2026-01-01",
        dateEnd: "2026-02-01",
        minConfidence: 50,
      },
      { sortBy: "date", sortOrder: "desc" },
      { page: undefined, pageSize: undefined },
    );
  });

  it("forwards sort query params to DAL", async () => {
    vi.mocked(getClassifiedComments).mockReturnValue({
      comments: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
    });

    const url =
      "http://localhost/api/review-quality/comments?sortBy=confidence&sortOrder=asc";
    const request = new Request(url);
    await GET(request);

    expect(getClassifiedComments).toHaveBeenCalledWith(
      expect.any(Object),
      { sortBy: "confidence", sortOrder: "asc" },
      { page: undefined, pageSize: undefined },
    );
  });

  it("forwards pagination query params to DAL", async () => {
    vi.mocked(getClassifiedComments).mockReturnValue({
      comments: [],
      totalCount: 45,
      page: 2,
      pageSize: 20,
    });

    const url =
      "http://localhost/api/review-quality/comments?page=2&pageSize=20";
    const request = new Request(url);
    const response = await GET(request);
    const data = await response.json();

    expect(data.totalCount).toBe(45);
    expect(data.page).toBe(2);
    expect(data.pageSize).toBe(20);
    expect(getClassifiedComments).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      { page: 2, pageSize: 20 },
    );
  });
});
