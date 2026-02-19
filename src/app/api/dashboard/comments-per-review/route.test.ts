// US-018: Tests for comments per review API route
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/db/team-members", () => ({
  getAllTeamMembers: vi.fn(() => [
    { id: 1, githubUsername: "alice", displayName: "Alice", avatarUrl: null, isActive: 1, createdAt: "", updatedAt: "" },
    { id: 2, githubUsername: "bob", displayName: "Bob", avatarUrl: null, isActive: 1, createdAt: "", updatedAt: "" },
  ]),
}));

vi.mock("@/db/review-comments", () => ({
  getAvgCommentsPerReviewByMember: vi.fn(() => [
    { reviewer: "alice", totalComments: 10, prsReviewed: 5, avg: 2.0 },
    { reviewer: "bob", totalComments: 3, prsReviewed: 3, avg: 1.0 },
  ]),
}));

function createRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/api/dashboard/comments-per-review");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString()) as Parameters<typeof GET>[0];
}

describe("GET /api/dashboard/comments-per-review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when startDate is missing", async () => {
    const res = await GET(createRequest({ endDate: "2026-03-01T00:00:00Z" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when endDate is missing", async () => {
    const res = await GET(createRequest({ startDate: "2026-02-01T00:00:00Z" }));
    expect(res.status).toBe(400);
  });

  it("returns comments per review data", async () => {
    const res = await GET(
      createRequest({
        startDate: "2026-02-01T00:00:00Z",
        endDate: "2026-03-01T00:00:00Z",
      }),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data).toHaveLength(2);
    expect(json.data[0]).toEqual({
      reviewer: "alice",
      totalComments: 10,
      prsReviewed: 5,
      avg: 2.0,
    });
  });
});
