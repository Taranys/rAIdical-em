// US-010 / US-011 / US-012 / US-014: GitHub sync service unit tests
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPaginate = vi.fn();
const mockPullsGet = vi.fn();
const mockPullsListReviews = vi.fn();
const mockPullsListReviewComments = vi.fn();
const mockIssuesListComments = vi.fn();
const mockGetRateLimit = vi.fn();

vi.mock("octokit", () => ({
  Octokit: class MockOctokit {
    paginate = mockPaginate;
    rest = {
      pulls: {
        list: "pulls.list",
        get: mockPullsGet,
        listReviews: mockPullsListReviews,
        listReviewComments: mockPullsListReviewComments,
      },
      issues: {
        listComments: mockIssuesListComments,
      },
      rateLimit: { get: mockGetRateLimit },
    };
  },
}));

vi.mock("@/db/pull-requests", () => ({
  upsertPullRequest: vi.fn(),
}));

vi.mock("@/db/reviews", () => ({
  upsertReview: vi.fn(),
}));

vi.mock("@/db/review-comments", () => ({
  upsertReviewComment: vi.fn(),
}));

vi.mock("@/db/pr-comments", () => ({
  upsertPrComment: vi.fn(),
}));

vi.mock("@/db/sync-runs", () => ({
  updateSyncRunProgress: vi.fn(),
  completeSyncRun: vi.fn(),
}));

import { syncPullRequests, fetchRateLimit } from "./github-sync";
import { upsertPullRequest } from "@/db/pull-requests";
import { upsertReview } from "@/db/reviews";
import { upsertReviewComment } from "@/db/review-comments";
import { upsertPrComment } from "@/db/pr-comments";
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

function makeReview(overrides: Record<string, unknown> = {}) {
  return {
    id: 200001,
    user: { login: "reviewer1" },
    state: "APPROVED",
    submitted_at: "2024-06-02T10:00:00Z",
    ...overrides,
  };
}

function makeReviewComment(overrides: Record<string, unknown> = {}) {
  return {
    id: 300001,
    user: { login: "reviewer1" },
    body: "Consider refactoring this",
    path: "src/index.ts",
    line: 42,
    created_at: "2024-06-02T10:00:00Z",
    updated_at: "2024-06-02T10:00:00Z",
    ...overrides,
  };
}

function makePrComment(overrides: Record<string, unknown> = {}) {
  return {
    id: 400001,
    user: { login: "commenter1" },
    body: "Great work!",
    created_at: "2024-06-02T10:00:00Z",
    updated_at: "2024-06-02T10:00:00Z",
    ...overrides,
  };
}

const defaultDbPR = {
  id: 1,
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
  aiGenerated: "human",
  rawJson: null,
};

// Helper: setup mocks for a standard open PR with reviews
function setupOpenPRWithReviews(reviews: Record<string, unknown>[] = [makeReview()]) {
  mockPaginate.mockResolvedValue([makeListItem()]);
  mockPullsGet.mockResolvedValue({ data: makeDetailPR() });
  vi.mocked(upsertPullRequest).mockReturnValue(defaultDbPR);
  mockPullsListReviews.mockResolvedValue({ data: reviews });
  mockPullsListReviewComments.mockResolvedValue({ data: [] });
  mockIssuesListComments.mockResolvedValue({ data: [] });
}

describe("syncPullRequests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: upsertPullRequest returns an object with id
    vi.mocked(upsertPullRequest).mockReturnValue(defaultDbPR);
    // Default: no reviews, no comments
    mockPullsListReviews.mockResolvedValue({ data: [] });
    mockPullsListReviewComments.mockResolvedValue({ data: [] });
    mockIssuesListComments.mockResolvedValue({ data: [] });
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

  it("completes sync run with success and counts", async () => {
    setupOpenPRWithReviews([makeReview(), makeReview({ id: 200002, user: { login: "reviewer2" } })]);

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(completeSyncRun).toHaveBeenCalledWith(1, "success", 1, null, 2, 0);
  });

  it("completes sync run with error on failure", async () => {
    mockPaginate.mockRejectedValue(new Error("API rate limit exceeded"));

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(completeSyncRun).toHaveBeenCalledWith(
      1,
      "error",
      0,
      "API rate limit exceeded",
      0,
      0,
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

  // US-011: Review fetching tests
  it("fetches reviews for all PRs", async () => {
    setupOpenPRWithReviews([makeReview()]);

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(mockPullsListReviews).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      pull_number: 1,
    });
  });

  it("fetches reviews for merged PRs too", async () => {
    mockPaginate.mockResolvedValue([
      makeListItem({ state: "closed", merged_at: "2024-06-02T10:00:00Z" }),
    ]);
    mockPullsGet.mockResolvedValue({
      data: makeDetailPR({ state: "closed", merged_at: "2024-06-02T10:00:00Z" }),
    });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(mockPullsListReviews).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      pull_number: 1,
    });
  });

  it("upserts each review for a PR", async () => {
    const reviews = [
      makeReview({ id: 200001, user: { login: "reviewer1" }, state: "APPROVED" }),
      makeReview({ id: 200002, user: { login: "reviewer2" }, state: "CHANGES_REQUESTED" }),
    ];
    setupOpenPRWithReviews(reviews);

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(upsertReview).toHaveBeenCalledTimes(2);
    expect(upsertReview).toHaveBeenCalledWith({
      githubId: 200001,
      pullRequestId: 1,
      reviewer: "reviewer1",
      state: "APPROVED",
      submittedAt: "2024-06-02T10:00:00Z",
    });
    expect(upsertReview).toHaveBeenCalledWith({
      githubId: 200002,
      pullRequestId: 1,
      reviewer: "reviewer2",
      state: "CHANGES_REQUESTED",
      submittedAt: "2024-06-02T10:00:00Z",
    });
  });

  it("tracks review count in sync run progress", async () => {
    setupOpenPRWithReviews([makeReview(), makeReview({ id: 200002 })]);

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(updateSyncRunProgress).toHaveBeenCalledWith(1, 1, 2, 0);
  });

  it("handles PR with no reviews", async () => {
    setupOpenPRWithReviews([]);

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(upsertReview).not.toHaveBeenCalled();
    expect(completeSyncRun).toHaveBeenCalledWith(1, "success", 1, null, 0, 0);
  });

  it("uses unknown as reviewer when user is null", async () => {
    setupOpenPRWithReviews([makeReview({ user: null })]);

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(upsertReview).toHaveBeenCalledWith(
      expect.objectContaining({ reviewer: "unknown" }),
    );
  });

  // US-012: Review comment fetching tests
  it("fetches review comments for each PR", async () => {
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });
    mockPullsListReviewComments.mockResolvedValue({
      data: [makeReviewComment()],
    });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(mockPullsListReviewComments).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      pull_number: 1,
    });
    expect(upsertReviewComment).toHaveBeenCalledWith({
      githubId: 300001,
      pullRequestId: 1,
      reviewer: "reviewer1",
      body: "Consider refactoring this",
      filePath: "src/index.ts",
      line: 42,
      createdAt: "2024-06-02T10:00:00Z",
      updatedAt: "2024-06-02T10:00:00Z",
    });
  });

  it("fetches PR comments (issue-style) for each PR", async () => {
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });
    mockIssuesListComments.mockResolvedValue({
      data: [makePrComment()],
    });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(mockIssuesListComments).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 1,
    });
    expect(upsertPrComment).toHaveBeenCalledWith({
      githubId: 400001,
      pullRequestId: 1,
      author: "commenter1",
      body: "Great work!",
      createdAt: "2024-06-02T10:00:00Z",
      updatedAt: "2024-06-02T10:00:00Z",
    });
  });

  it("tracks commentCount from both review comments and PR comments", async () => {
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });
    mockPullsListReviewComments.mockResolvedValue({
      data: [makeReviewComment(), makeReviewComment({ id: 300002 })],
    });
    mockIssuesListComments.mockResolvedValue({
      data: [makePrComment()],
    });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    // 2 review comments + 1 PR comment = 3 total
    expect(completeSyncRun).toHaveBeenCalledWith(1, "success", 1, null, 0, 3);
  });

  it("continues sync if review comment fetch fails for one PR", async () => {
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });
    mockPullsListReviewComments.mockRejectedValue(new Error("Comment fetch failed"));

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    // Should still complete successfully
    expect(completeSyncRun).toHaveBeenCalledWith(1, "success", 1, null, 0, 0);
  });

  it("continues sync if PR comment fetch fails for one PR", async () => {
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });
    mockIssuesListComments.mockRejectedValue(new Error("Issue comment fetch failed"));

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    // Should still complete successfully
    expect(completeSyncRun).toHaveBeenCalledWith(1, "success", 1, null, 0, 0);
  });

  it("handles null user in review comments", async () => {
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });
    mockPullsListReviewComments.mockResolvedValue({
      data: [makeReviewComment({ user: null })],
    });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(upsertReviewComment).toHaveBeenCalledWith(
      expect.objectContaining({ reviewer: "unknown" }),
    );
  });

  it("handles null user in PR comments", async () => {
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });
    mockIssuesListComments.mockResolvedValue({
      data: [makePrComment({ user: null })],
    });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(upsertPrComment).toHaveBeenCalledWith(
      expect.objectContaining({ author: "unknown" }),
    );
  });

  it("handles null path and line in review comments", async () => {
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });
    mockPullsListReviewComments.mockResolvedValue({
      data: [makeReviewComment({ path: null, line: null })],
    });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(upsertReviewComment).toHaveBeenCalledWith(
      expect.objectContaining({ filePath: null, line: null }),
    );
  });

  // US-014: Incremental sync tests
  it("passes since parameter to Octokit when provided", async () => {
    mockPaginate.mockResolvedValue([]);

    await syncPullRequests("owner", "repo", "ghp_token", 1, "2024-06-01T00:00:00Z");

    expect(mockPaginate).toHaveBeenCalledWith("pulls.list", {
      owner: "owner",
      repo: "repo",
      state: "all",
      per_page: 100,
      since: "2024-06-01T00:00:00Z",
    });
  });

  it("does NOT pass since parameter when undefined (full sync)", async () => {
    mockPaginate.mockResolvedValue([]);

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(mockPaginate).toHaveBeenCalledWith("pulls.list", {
      owner: "owner",
      repo: "repo",
      state: "all",
      per_page: 100,
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
