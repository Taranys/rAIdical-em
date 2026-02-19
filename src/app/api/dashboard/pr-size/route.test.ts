// US-016: Tests for PR size API route
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/db/team-members", () => ({
  getAllTeamMembers: vi.fn(() => [
    { id: 1, githubUsername: "alice", displayName: "Alice", avatarUrl: null, isActive: 1, createdAt: "", updatedAt: "" },
  ]),
}));

vi.mock("@/db/pull-requests", () => ({
  getMedianPRSizeByMember: vi.fn(() => [
    { author: "alice", medianAdditions: 100, medianDeletions: 30, prCount: 5 },
  ]),
}));

function createRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/api/dashboard/pr-size");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe("GET /api/dashboard/pr-size", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when dates are missing", async () => {
    const res = await GET(createRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns byMember data with median values", async () => {
    const res = await GET(
      createRequest({
        startDate: "2026-02-01T00:00:00Z",
        endDate: "2026-03-01T00:00:00Z",
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.byMember).toHaveLength(1);
    expect(data.byMember[0].medianAdditions).toBe(100);
  });
});
