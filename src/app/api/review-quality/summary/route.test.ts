// US-2.07: Review quality summary API route tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/comment-classifications", () => ({
  getCategoryDistribution: vi.fn(),
}));

import { GET } from "./route";
import { getCategoryDistribution } from "@/db/comment-classifications";

describe("GET /api/review-quality/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns category distribution", async () => {
    vi.mocked(getCategoryDistribution).mockReturnValue({
      classified: [
        { category: "bug_correctness", count: 5 },
        { category: "nitpick_style", count: 3 },
      ],
      unclassifiedCount: 2,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.classified).toHaveLength(2);
    expect(data.unclassifiedCount).toBe(2);
  });
});
