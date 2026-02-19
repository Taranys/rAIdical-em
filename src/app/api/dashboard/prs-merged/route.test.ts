// Tests for PRs merged API route
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/db/team-members", () => ({
  getAllTeamMembers: vi.fn(() => [
    { id: 1, githubUsername: "alice", displayName: "Alice", avatarUrl: null, isActive: 1, createdAt: "", updatedAt: "" },
    { id: 2, githubUsername: "bob", displayName: "Bob", avatarUrl: null, isActive: 1, createdAt: "", updatedAt: "" },
  ]),
}));

vi.mock("@/db/pull-requests", () => ({
  getPRsMergedByMember: vi.fn(() => [
    { author: "alice", count: 5 },
    { author: "bob", count: 3 },
  ]),
  getPRsMergedPerWeek: vi.fn(() => [
    { week: "2026-W06", count: 4 },
    { week: "2026-W07", count: 4 },
  ]),
}));

function createRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/api/dashboard/prs-merged");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString()) as Parameters<typeof GET>[0];
}

describe("GET /api/dashboard/prs-merged", () => {
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

  it("returns byMember and byWeek data", async () => {
    const res = await GET(
      createRequest({
        startDate: "2026-02-01T00:00:00Z",
        endDate: "2026-03-01T00:00:00Z",
      }),
    );
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.byMember).toHaveLength(2);
    expect(data.byWeek).toHaveLength(2);
    expect(data.byMember[0]).toEqual({ author: "alice", count: 5 });
  });
});
