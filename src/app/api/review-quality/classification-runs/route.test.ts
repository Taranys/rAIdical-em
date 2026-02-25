// US-2.15: Classification run history API route tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/classification-runs", () => ({
  getClassificationRunHistory: vi.fn(),
}));

import { GET } from "./route";
import { getClassificationRunHistory } from "@/db/classification-runs";

describe("GET /api/review-quality/classification-runs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns classification runs from the DAL", async () => {
    vi.mocked(getClassificationRunHistory).mockReturnValue([
      {
        id: 1,
        startedAt: "2026-02-20T10:00:00Z",
        completedAt: "2026-02-20T10:05:00Z",
        status: "success",
        commentsProcessed: 42,
        errors: 0,
        modelUsed: "claude-sonnet-4-5-20250929",
      },
      {
        id: 2,
        startedAt: "2026-02-21T14:00:00Z",
        completedAt: null,
        status: "running",
        commentsProcessed: 10,
        errors: 1,
        modelUsed: "claude-sonnet-4-5-20250929",
      },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.runs).toHaveLength(2);
    expect(data.runs[0].status).toBe("success");
    expect(data.runs[1].status).toBe("running");
    expect(getClassificationRunHistory).toHaveBeenCalledWith(100);
  });

  it("returns empty array when no runs exist", async () => {
    vi.mocked(getClassificationRunHistory).mockReturnValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.runs).toEqual([]);
  });
});
