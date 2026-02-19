// US-021: Tests for AI ratio API route
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/db/team-members", () => ({
  getAllTeamMembers: vi.fn(() => [
    { id: 1, githubUsername: "alice", displayName: "Alice", avatarUrl: null, isActive: 1, createdAt: "", updatedAt: "" },
    { id: 2, githubUsername: "bob", displayName: "Bob", avatarUrl: null, isActive: 1, createdAt: "", updatedAt: "" },
  ]),
}));

vi.mock("@/db/pull-requests", () => ({
  getAiRatioByMember: vi.fn(() => [
    { author: "alice", aiGenerated: "human", count: 5 },
    { author: "alice", aiGenerated: "ai", count: 3 },
    { author: "bob", aiGenerated: "human", count: 7 },
  ]),
  getAiRatioTeamTotal: vi.fn(() => [
    { aiGenerated: "human", count: 12 },
    { aiGenerated: "ai", count: 3 },
  ]),
}));

function createRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/api/dashboard/ai-ratio");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString()) as Parameters<typeof GET>[0];
}

describe("GET /api/dashboard/ai-ratio", () => {
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

  it("returns byMember and teamTotal data", async () => {
    const res = await GET(
      createRequest({
        startDate: "2026-02-01T00:00:00Z",
        endDate: "2026-03-01T00:00:00Z",
      }),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.byMember).toHaveLength(3);
    expect(json.teamTotal).toHaveLength(2);
    expect(json.byMember[0]).toEqual({
      author: "alice",
      aiGenerated: "human",
      count: 5,
    });
  });
});
