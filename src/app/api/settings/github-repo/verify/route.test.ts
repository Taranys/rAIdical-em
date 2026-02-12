// US-006: Unit tests for GitHub repository verify API
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/db/settings", () => ({
  getSetting: vi.fn(),
}));

import { getSetting } from "@/db/settings";

const mockGetSetting = vi.mocked(getSetting);

const mockReposGet = vi.fn();

vi.mock("octokit", () => ({
  Octokit: class {
    rest = { repos: { get: mockReposGet } };
  },
}));

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/settings/github-repo/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/settings/github-repo/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when owner or repo is missing", async () => {
    const res = await POST(makeRequest({ owner: "my-org" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Owner and repo are required");
  });

  it("returns 400 when no PAT is configured", async () => {
    mockGetSetting.mockReturnValue(null);

    const res = await POST(makeRequest({ owner: "my-org", repo: "my-repo" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("No PAT configured");
  });

  it("returns success with repository details when accessible", async () => {
    mockGetSetting.mockReturnValue("ghp_token123");

    mockReposGet.mockResolvedValue({
      data: {
        full_name: "my-org/my-repo",
        description: "A great repo",
        private: false,
        default_branch: "main",
      },
    });

    const res = await POST(makeRequest({ owner: "my-org", repo: "my-repo" }));
    const data = await res.json();

    expect(data).toEqual({
      success: true,
      repository: {
        fullName: "my-org/my-repo",
        description: "A great repo",
        isPrivate: false,
        defaultBranch: "main",
      },
    });
  });

  it("returns 404 when repository is not found", async () => {
    mockGetSetting.mockReturnValue("ghp_token123");

    mockReposGet.mockRejectedValue(new Error("Not Found"));

    const res = await POST(
      makeRequest({ owner: "my-org", repo: "nonexistent" }),
    );
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toEqual({ success: false, error: "Not Found" });
  });
});
