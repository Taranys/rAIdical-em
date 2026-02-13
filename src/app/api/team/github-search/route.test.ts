// US-024: Unit tests for GitHub user search API route
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSearchUsers = vi.fn();

vi.mock("@/db/settings");
vi.mock("octokit", () => ({
  Octokit: class MockOctokit {
    rest = { search: { users: mockSearchUsers } };
  },
}));

import { GET } from "./route";
import * as settingsDAL from "@/db/settings";

function makeRequest(query: string) {
  return new Request(`http://localhost/api/team/github-search?q=${encodeURIComponent(query)}`);
}

describe("GET /api/team/github-search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when query is missing", async () => {
    const response = await GET(new Request("http://localhost/api/team/github-search"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/query/i);
  });

  it("returns 400 when query is too short", async () => {
    const response = await GET(makeRequest("a"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/at least 2/i);
  });

  it("returns 400 when no PAT configured", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue(null);

    const response = await GET(makeRequest("octo"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/PAT/i);
  });

  it("returns search results with rate limit info", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue("ghp_test");
    mockSearchUsers.mockResolvedValue({
      data: {
        items: [
          { login: "octocat", name: "The Octocat", avatar_url: "https://avatars.example.com/1" },
          { login: "octokitten", name: null, avatar_url: "https://avatars.example.com/2" },
        ],
      },
      headers: {
        "x-ratelimit-remaining": "28",
        "x-ratelimit-reset": "1700000000",
      },
    });

    const response = await GET(makeRequest("octo"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(2);
    expect(data.users[0]).toEqual({
      login: "octocat",
      name: "The Octocat",
      avatarUrl: "https://avatars.example.com/1",
    });
    expect(data.users[1]).toEqual({
      login: "octokitten",
      name: null,
      avatarUrl: "https://avatars.example.com/2",
    });
    expect(data.rateLimit).toEqual({ remaining: 28, reset: 1700000000 });
    expect(mockSearchUsers).toHaveBeenCalledWith({ q: "octo", per_page: 20 });
  });

  it("returns 500 on Octokit error", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue("ghp_test");
    mockSearchUsers.mockRejectedValue(new Error("API error"));

    const response = await GET(makeRequest("octo"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toMatch(/API error/i);
  });
});
