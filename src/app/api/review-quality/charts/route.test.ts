// US-2.08: Review quality charts API route tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/comment-classifications", () => ({
  getCategoryDistributionFiltered: vi.fn(),
  getCategoryDistributionByReviewer: vi.fn(),
  getCategoryTrendByWeek: vi.fn(),
}));

vi.mock("@/db/team-members", () => ({
  getAllTeamMembers: vi.fn(),
}));

import { GET } from "./route";
import {
  getCategoryDistributionFiltered,
  getCategoryDistributionByReviewer,
  getCategoryTrendByWeek,
} from "@/db/comment-classifications";
import { getAllTeamMembers } from "@/db/team-members";

describe("GET /api/review-quality/charts", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getAllTeamMembers).mockReturnValue([
      { id: 1, githubUsername: "alice", displayName: "Alice", avatarUrl: null, color: "#E25A3B", isActive: 1, createdAt: "", updatedAt: "" },
      { id: 2, githubUsername: "bob", displayName: "Bob", avatarUrl: null, color: "#3B82F6", isActive: 1, createdAt: "", updatedAt: "" },
    ]);

    vi.mocked(getCategoryDistributionFiltered).mockReturnValue([
      { category: "bug_correctness", count: 5 },
    ]);

    vi.mocked(getCategoryDistributionByReviewer).mockReturnValue([
      { reviewer: "alice", category: "bug_correctness", count: 3 },
      { reviewer: "bob", category: "bug_correctness", count: 2 },
    ]);

    vi.mocked(getCategoryTrendByWeek).mockReturnValue([
      { week: "2026-W06", category: "bug_correctness", count: 5 },
    ]);
  });

  it("returns all three chart datasets", async () => {
    const req = new Request("http://localhost/api/review-quality/charts");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.teamDistribution).toHaveLength(1);
    expect(data.perReviewer).toHaveLength(2);
    expect(data.weeklyTrend).toHaveLength(1);
  });

  it("passes date filters to DAL functions", async () => {
    const req = new Request(
      "http://localhost/api/review-quality/charts?dateStart=2026-02-01&dateEnd=2026-03-01",
    );
    await GET(req);

    expect(getCategoryDistributionFiltered).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: "2026-02-01",
        endDate: "2026-03-01",
      }),
    );

    expect(getCategoryTrendByWeek).toHaveBeenCalledWith(
      ["alice", "bob"],
      "2026-02-01",
      "2026-03-01",
    );
  });

  it("uses all team members when no reviewer filter", async () => {
    const req = new Request("http://localhost/api/review-quality/charts");
    await GET(req);

    expect(getCategoryDistributionFiltered).toHaveBeenCalledWith(
      expect.objectContaining({
        teamUsernames: ["alice", "bob"],
      }),
    );

    expect(getCategoryDistributionByReviewer).toHaveBeenCalledWith(
      ["alice", "bob"],
      expect.any(String),
      expect.any(String),
    );
  });

  it("uses single reviewer when filter is set", async () => {
    const req = new Request(
      "http://localhost/api/review-quality/charts?reviewer=alice",
    );
    await GET(req);

    expect(getCategoryDistributionFiltered).toHaveBeenCalledWith(
      expect.objectContaining({
        teamUsernames: ["alice"],
      }),
    );

    expect(getCategoryDistributionByReviewer).toHaveBeenCalledWith(
      ["alice"],
      expect.any(String),
      expect.any(String),
    );
  });
});
