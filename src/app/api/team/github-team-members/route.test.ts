// US-024: Unit tests for GitHub team members API route
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockListMembersInOrg = vi.fn();

vi.mock("@/db/settings");
vi.mock("octokit", () => ({
  Octokit: class MockOctokit {
    rest = { teams: { listMembersInOrg: mockListMembersInOrg } };
  },
}));

import { GET } from "./route";
import * as settingsDAL from "@/db/settings";

function makeRequest(org: string, team: string) {
  return new Request(
    `http://localhost/api/team/github-team-members?org=${encodeURIComponent(org)}&team=${encodeURIComponent(team)}`,
  );
}

describe("GET /api/team/github-team-members", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when org is missing", async () => {
    const response = await GET(
      new Request("http://localhost/api/team/github-team-members?team=frontend"),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/organization/i);
  });

  it("returns 400 when team slug is missing", async () => {
    const response = await GET(
      new Request("http://localhost/api/team/github-team-members?org=my-org"),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/team/i);
  });

  it("returns 400 when no PAT configured", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue(null);

    const response = await GET(makeRequest("my-org", "frontend"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/PAT/i);
  });

  it("returns team members with rate limit info", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue("ghp_test");
    mockListMembersInOrg.mockResolvedValue({
      data: [
        { login: "alice", avatar_url: "https://avatars.example.com/1" },
        { login: "bob", avatar_url: "https://avatars.example.com/2" },
      ],
      headers: {
        "x-ratelimit-remaining": "4990",
        "x-ratelimit-reset": "1700000000",
      },
    });

    const response = await GET(makeRequest("my-org", "frontend"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.members).toHaveLength(2);
    expect(data.members[0]).toEqual({
      login: "alice",
      avatarUrl: "https://avatars.example.com/1",
    });
    expect(data.members[1]).toEqual({
      login: "bob",
      avatarUrl: "https://avatars.example.com/2",
    });
    expect(data.rateLimit).toEqual({ remaining: 4990, reset: 1700000000 });
    expect(mockListMembersInOrg).toHaveBeenCalledWith({
      org: "my-org",
      team_slug: "frontend",
      per_page: 100,
    });
  });

  it("returns 404 when team not found", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue("ghp_test");
    const notFoundError = Object.assign(new Error("Not Found"), { status: 404 });
    mockListMembersInOrg.mockRejectedValue(notFoundError);

    const response = await GET(makeRequest("my-org", "nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toMatch(/not found/i);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue("ghp_test");
    mockListMembersInOrg.mockRejectedValue(new Error("Network error"));

    const response = await GET(makeRequest("my-org", "frontend"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toMatch(/network error/i);
  });
});
