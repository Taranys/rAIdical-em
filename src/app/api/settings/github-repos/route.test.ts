// US-006: Unit tests for GitHub repository search API
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/db/settings", () => ({
  getSetting: vi.fn(),
}));

import { getSetting } from "@/db/settings";

const mockGetSetting = vi.mocked(getSetting);

const mockSearchRepos = vi.fn();

vi.mock("octokit", () => ({
  Octokit: class {
    rest = { search: { repos: mockSearchRepos } };
  },
}));

describe("GET /api/settings/github-repos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when owner param is missing", async () => {
    const request = new Request("http://localhost/api/settings/github-repos");
    const res = await GET(request);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Owner parameter is required");
  });

  it("returns 400 when no PAT is configured", async () => {
    mockGetSetting.mockReturnValue(null);

    const request = new Request(
      "http://localhost/api/settings/github-repos?owner=my-org",
    );
    const res = await GET(request);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("No PAT configured");
  });

  it("returns repos on successful search", async () => {
    mockGetSetting.mockReturnValue("ghp_token123");

    mockSearchRepos.mockResolvedValue({
      data: {
        items: [
          {
            name: "repo-one",
            full_name: "my-org/repo-one",
            description: "First repo",
            private: false,
          },
          {
            name: "repo-two",
            full_name: "my-org/repo-two",
            description: null,
            private: true,
          },
        ],
      },
    });

    const request = new Request(
      "http://localhost/api/settings/github-repos?owner=my-org&q=repo",
    );
    const res = await GET(request);
    const data = await res.json();

    expect(data.repos).toEqual([
      {
        name: "repo-one",
        fullName: "my-org/repo-one",
        description: "First repo",
        isPrivate: false,
      },
      {
        name: "repo-two",
        fullName: "my-org/repo-two",
        description: null,
        isPrivate: true,
      },
    ]);

    expect(mockSearchRepos).toHaveBeenCalledWith({
      q: "repo in:name user:my-org",
      per_page: 20,
      sort: "updated",
    });
  });

  it("builds query without q param for listing all repos", async () => {
    mockGetSetting.mockReturnValue("ghp_token123");

    mockSearchRepos.mockResolvedValue({
      data: { items: [] },
    });

    const request = new Request(
      "http://localhost/api/settings/github-repos?owner=my-org",
    );
    await GET(request);

    expect(mockSearchRepos).toHaveBeenCalledWith({
      q: "user:my-org",
      per_page: 20,
      sort: "updated",
    });
  });

  it("returns 500 on Octokit error", async () => {
    mockGetSetting.mockReturnValue("ghp_token123");

    mockSearchRepos.mockRejectedValue(new Error("API rate limit exceeded"));

    const request = new Request(
      "http://localhost/api/settings/github-repos?owner=my-org",
    );
    const res = await GET(request);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("API rate limit exceeded");
  });
});
