// US-024: Unit tests for GitHub org teams API route
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockListTeams = vi.fn();

vi.mock("@/db/settings");
vi.mock("octokit", () => ({
  Octokit: class MockOctokit {
    rest = { teams: { list: mockListTeams } };
  },
}));

import { GET } from "./route";
import * as settingsDAL from "@/db/settings";

function makeRequest(org: string) {
  return new Request(`http://localhost/api/team/github-org-teams?org=${encodeURIComponent(org)}`);
}

describe("GET /api/team/github-org-teams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when org is missing", async () => {
    const response = await GET(new Request("http://localhost/api/team/github-org-teams"));
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

  it("returns org teams with rate limit info", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue("ghp_test");
    mockListTeams.mockResolvedValue({
      data: [
        { slug: "frontend", name: "Frontend Team", description: "The frontend squad" },
        { slug: "backend", name: "Backend Team", description: null },
      ],
      headers: {
        "x-ratelimit-remaining": "4990",
        "x-ratelimit-reset": "1700000000",
      },
    });

    const response = await GET(makeRequest("my-org"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.teams).toHaveLength(2);
    expect(data.teams[0]).toEqual({
      slug: "frontend",
      name: "Frontend Team",
      description: "The frontend squad",
    });
    expect(data.teams[1]).toEqual({
      slug: "backend",
      name: "Backend Team",
      description: null,
    });
    expect(data.rateLimit).toEqual({ remaining: 4990, reset: 1700000000 });
    expect(mockListTeams).toHaveBeenCalledWith({ org: "my-org", per_page: 100 });
  });

  it("returns 404 when org not found", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue("ghp_test");
    const notFoundError = Object.assign(new Error("Not Found"), { status: 404 });
    mockListTeams.mockRejectedValue(notFoundError);

    const response = await GET(makeRequest("nonexistent-org"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toMatch(/not found/i);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue("ghp_test");
    mockListTeams.mockRejectedValue(new Error("Network error"));

    const response = await GET(makeRequest("my-org"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toMatch(/network error/i);
  });
});
