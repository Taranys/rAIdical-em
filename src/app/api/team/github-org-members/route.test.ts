// US-024: Unit tests for GitHub org members API route
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockListMembers = vi.fn();

vi.mock("@/db/settings");
vi.mock("octokit", () => ({
  Octokit: class MockOctokit {
    rest = { orgs: { listMembers: mockListMembers } };
  },
}));

import { GET } from "./route";
import * as settingsDAL from "@/db/settings";

function makeRequest(org: string) {
  return new Request(`http://localhost/api/team/github-org-members?org=${encodeURIComponent(org)}`);
}

describe("GET /api/team/github-org-members", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when org is missing", async () => {
    const response = await GET(new Request("http://localhost/api/team/github-org-members"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/organization/i);
  });

  it("returns 400 when no PAT configured", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue(null);

    const response = await GET(makeRequest("my-org"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/PAT/i);
  });

  it("returns org members with rate limit info", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue("ghp_test");
    mockListMembers.mockResolvedValue({
      data: [
        { login: "octocat", avatar_url: "https://avatars.example.com/1" },
        { login: "octokitten", avatar_url: "https://avatars.example.com/2" },
      ],
      headers: {
        "x-ratelimit-remaining": "4990",
        "x-ratelimit-reset": "1700000000",
      },
    });

    const response = await GET(makeRequest("my-org"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.members).toHaveLength(2);
    expect(data.members[0]).toEqual({
      login: "octocat",
      avatarUrl: "https://avatars.example.com/1",
    });
    expect(data.members[1]).toEqual({
      login: "octokitten",
      avatarUrl: "https://avatars.example.com/2",
    });
    expect(data.rateLimit).toEqual({ remaining: 4990, reset: 1700000000 });
    expect(mockListMembers).toHaveBeenCalledWith({ org: "my-org", per_page: 100 });
  });

  it("returns 404 when org not found", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue("ghp_test");
    const notFoundError = Object.assign(new Error("Not Found"), { status: 404 });
    mockListMembers.mockRejectedValue(notFoundError);

    const response = await GET(makeRequest("nonexistent-org"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toMatch(/not found/i);
  });

  it("returns 403 when access is forbidden", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue("ghp_test");
    const forbiddenError = Object.assign(new Error("Forbidden"), { status: 403 });
    mockListMembers.mockRejectedValue(forbiddenError);

    const response = await GET(makeRequest("secret-org"));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toMatch(/forbidden/i);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue("ghp_test");
    mockListMembers.mockRejectedValue(new Error("Network error"));

    const response = await GET(makeRequest("my-org"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toMatch(/network error/i);
  });
});
