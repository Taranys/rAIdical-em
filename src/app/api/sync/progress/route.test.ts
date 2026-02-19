// US-025: Tests for sync progress API route
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/db/team-members", () => ({
  getAllTeamMembers: vi.fn(() => [
    { id: 1, githubUsername: "alice", displayName: "Alice", avatarUrl: null, isActive: 1, createdAt: "", updatedAt: "" },
    { id: 2, githubUsername: "bob", displayName: "Bob", avatarUrl: null, isActive: 1, createdAt: "", updatedAt: "" },
  ]),
}));

vi.mock("@/db/pull-requests", () => ({
  getPRCountByAuthor: vi.fn(() => [
    { author: "alice", count: 12 },
    { author: "bob", count: 8 },
    { author: "stranger", count: 3 },
  ]),
}));

function createRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/api/sync/progress");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString()) as Parameters<typeof GET>[0];
}

describe("GET /api/sync/progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when sinceDate is missing", async () => {
    const res = await GET(createRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns team progress and non-team count", async () => {
    const res = await GET(createRequest({ sinceDate: "2025-10-01T00:00:00Z" }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.teamProgress).toHaveLength(2);
    expect(json.teamProgress[0]).toEqual({ author: "alice", count: 12 });
    expect(json.teamProgress[1]).toEqual({ author: "bob", count: 8 });
    expect(json.nonTeamCount).toBe(3);
    expect(json.totalCount).toBe(23);
  });
});
