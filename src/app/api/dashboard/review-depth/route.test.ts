// US-2.09: Tests for review depth score API route
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/db/team-members", () => ({
  getAllTeamMembers: vi.fn(() => [
    { id: 1, githubUsername: "alice", displayName: "Alice", avatarUrl: null, isActive: 1, createdAt: "", updatedAt: "" },
    { id: 2, githubUsername: "bob", displayName: "Bob", avatarUrl: null, isActive: 1, createdAt: "", updatedAt: "" },
  ]),
}));

vi.mock("@/db/comment-classifications", () => ({
  getCategoryDistributionByReviewer: vi.fn(() => [
    { reviewer: "alice", category: "architecture_design", count: 5 },
    { reviewer: "alice", category: "bug_correctness", count: 3 },
    { reviewer: "bob", category: "nitpick_style", count: 8 },
    { reviewer: "bob", category: "question_clarification", count: 2 },
  ]),
}));

function createRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/api/dashboard/review-depth");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString()) as Parameters<typeof GET>[0];
}

describe("GET /api/dashboard/review-depth", () => {
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

  it("returns depth scores per team member", async () => {
    const res = await GET(
      createRequest({
        startDate: "2026-02-01T00:00:00Z",
        endDate: "2026-03-01T00:00:00Z",
      }),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data).toHaveLength(2);

    const alice = json.data.find((d: { reviewer: string }) => d.reviewer === "alice");
    const bob = json.data.find((d: { reviewer: string }) => d.reviewer === "bob");

    // alice: (5*100 + 3*85) / 8 = 755/8 = 94.375 => 94
    expect(alice.score).toBe(94);
    expect(alice.totalComments).toBe(8);
    expect(alice.categoryBreakdown).toHaveLength(2);

    // bob: (8*10 + 2*30) / 10 = 140/10 = 14
    expect(bob.score).toBe(14);
    expect(bob.totalComments).toBe(10);

    // Deep reviewer scores higher than surface reviewer
    expect(alice.score).toBeGreaterThan(bob.score);
  });
});
