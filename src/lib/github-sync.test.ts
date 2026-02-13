// US-010: GitHub sync service unit tests
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPaginate = vi.fn();
const mockPullsGet = vi.fn();
const mockGetRateLimit = vi.fn();

vi.mock("octokit", () => ({
  Octokit: class MockOctokit {
    paginate = mockPaginate;
    rest = {
      pulls: { list: "pulls.list", get: mockPullsGet },
      rateLimit: { get: mockGetRateLimit },
    };
  },
}));

vi.mock("@/db/pull-requests", () => ({
  upsertPullRequest: vi.fn(),
}));

vi.mock("@/db/sync-runs", () => ({
  updateSyncRunProgress: vi.fn(),
  completeSyncRun: vi.fn(),
}));

import { syncPullRequests, fetchRateLimit } from "./github-sync";
import { upsertPullRequest } from "@/db/pull-requests";
import { updateSyncRunProgress, completeSyncRun } from "@/db/sync-runs";

function makeListItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 12345,
    number: 1,
    title: "Add feature",
    user: { login: "octocat" },
    state: "open",
    created_at: "2024-06-01T10:00:00Z",
    merged_at: null,
    ...overrides,
  };
}

function makeDetailPR(overrides: Record<string, unknown> = {}) {
  return {
    id: 12345,
    number: 1,
    title: "Add feature",
    user: { login: "octocat" },
    state: "open",
    created_at: "2024-06-01T10:00:00Z",
    merged_at: null,
    additions: 50,
    deletions: 10,
    changed_files: 3,
    ...overrides,
  };
}

describe("syncPullRequests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches PRs and upserts each one", async () => {
    mockPaginate.mockResolvedValue([
      makeListItem(),
      makeListItem({ id: 99999, number: 2 }),
    ]);
    mockPullsGet
      .mockResolvedValueOnce({ data: makeDetailPR() })
      .mockResolvedValueOnce({ data: makeDetailPR({ id: 99999, number: 2 }) });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(mockPaginate).toHaveBeenCalledWith("pulls.list", {
      owner: "owner",
      repo: "repo",
      state: "all",
      per_page: 100,
    });
    expect(upsertPullRequest).toHaveBeenCalledTimes(2);
    expect(updateSyncRunProgress).toHaveBeenCalledTimes(2);
  });

  it("maps open state correctly", async () => {
    mockPaginate.mockResolvedValue([makeListItem({ state: "open", merged_at: null })]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR({ state: "open", merged_at: null }) });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(upsertPullRequest).toHaveBeenCalledWith(
      expect.objectContaining({ state: "open" }),
    );
  });

  it("maps closed state correctly", async () => {
    mockPaginate.mockResolvedValue([makeListItem({ state: "closed", merged_at: null })]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR({ state: "closed", merged_at: null }) });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(upsertPullRequest).toHaveBeenCalledWith(
      expect.objectContaining({ state: "closed" }),
    );
  });

  it("maps merged state from merged_at", async () => {
    mockPaginate.mockResolvedValue([
      makeListItem({ state: "closed", merged_at: "2024-06-02T10:00:00Z" }),
    ]);
    mockPullsGet.mockResolvedValue({
      data: makeDetailPR({ state: "closed", merged_at: "2024-06-02T10:00:00Z" }),
    });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(upsertPullRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        state: "merged",
        mergedAt: "2024-06-02T10:00:00Z",
      }),
    );
  });

  it("completes sync run with success on completion", async () => {
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(completeSyncRun).toHaveBeenCalledWith(1, "success", 1, null);
  });

  it("completes sync run with error on failure", async () => {
    mockPaginate.mockRejectedValue(new Error("API rate limit exceeded"));

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(completeSyncRun).toHaveBeenCalledWith(
      1,
      "error",
      0,
      "API rate limit exceeded",
    );
  });

  it("maps PR fields correctly", async () => {
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(upsertPullRequest).toHaveBeenCalledWith({
      githubId: 12345,
      number: 1,
      title: "Add feature",
      author: "octocat",
      state: "open",
      createdAt: "2024-06-01T10:00:00Z",
      mergedAt: null,
      additions: 50,
      deletions: 10,
      changedFiles: 3,
    });
  });

  it("calls pulls.get for each PR to get detail", async () => {
    mockPaginate.mockResolvedValue([
      makeListItem({ number: 1 }),
      makeListItem({ number: 2, id: 99999 }),
    ]);
    mockPullsGet
      .mockResolvedValueOnce({ data: makeDetailPR({ number: 1 }) })
      .mockResolvedValueOnce({ data: makeDetailPR({ number: 2, id: 99999 }) });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(mockPullsGet).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      pull_number: 1,
    });
    expect(mockPullsGet).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      pull_number: 2,
    });
  });
});

describe("fetchRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns formatted rate limit data", async () => {
    mockGetRateLimit.mockResolvedValue({
      data: {
        rate: {
          limit: 5000,
          remaining: 4500,
          reset: 1717250400,
        },
      },
    });

    const result = await fetchRateLimit("ghp_token");

    expect(result).toEqual({
      limit: 5000,
      remaining: 4500,
      resetAt: new Date(1717250400 * 1000).toISOString(),
    });
  });
});
