// US-010 / US-011 / US-012 / US-014 / US-2.06: GitHub sync service unit tests
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPaginate = vi.fn();
const mockPullsGet = vi.fn();
const mockPullsListReviews = vi.fn();
const mockPullsListReviewComments = vi.fn();
const mockPullsListCommits = vi.fn();
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
        listCommits: mockPullsListCommits,
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

vi.mock("@/lib/ai-detection", () => ({
  classifyPullRequest: vi.fn(),
  DEFAULT_AI_HEURISTICS: {
    coAuthorPatterns: ["*Claude*"],
    authorBotList: ["dependabot"],
    branchNamePatterns: ["ai/*"],
    labels: ["ai-generated"],
    enabled: { coAuthor: true, authorBot: true, branchName: true, label: true },
  },
}));

vi.mock("@/db/settings", () => ({
  getSetting: vi.fn(),
}));

// US-2.06: Auto-classification mocks
vi.mock("@/lib/classification-service", () => ({
  classifyComments: vi.fn(),
}));

vi.mock("@/db/classification-runs", () => ({
  getActiveClassificationRun: vi.fn(),
}));

vi.mock("@/db/team-members", () => ({
  getActiveTeamMemberUsernames: vi.fn(),
}));

import { syncPullRequests, fetchRateLimit } from "./github-sync";
import { upsertPullRequest } from "@/db/pull-requests";
import { upsertReview } from "@/db/reviews";
import { upsertReviewComment } from "@/db/review-comments";
import { upsertPrComment } from "@/db/pr-comments";
import { updateSyncRunProgress, completeSyncRun } from "@/db/sync-runs";
import { classifyPullRequest } from "@/lib/ai-detection";
import { getSetting } from "@/db/settings";
import { classifyComments } from "@/lib/classification-service";
import { getActiveClassificationRun } from "@/db/classification-runs";
import { getActiveTeamMemberUsernames } from "@/db/team-members";

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
    head: { ref: "feature/my-thing" },
    labels: [],
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
    // US-020: Default classification mocks
    mockPullsListCommits.mockResolvedValue({ data: [] });
    vi.mocked(classifyPullRequest).mockReturnValue("human");
    vi.mocked(getSetting).mockReturnValue(null);
    // Default: no team members = no filtering (backward-compatible)
    vi.mocked(getActiveTeamMemberUsernames).mockReturnValue(new Set());
    // US-2.06: Default auto-classify mocks
    vi.mocked(getActiveClassificationRun).mockReturnValue(null);
    vi.mocked(classifyComments).mockResolvedValue({
      runId: 1,
      status: "success",
      commentsProcessed: 0,
      totalComments: 0,
      errors: 0,
      summary: { categories: [], totalClassified: 0, averageConfidence: 0 },
    });
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
      aiGenerated: "human",
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

  // US-020: AI classification integration tests
  it("calls listCommits for each PR", async () => {
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(mockPullsListCommits).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      pull_number: 1,
    });
  });

  it("passes PR data and commits to classifyPullRequest", async () => {
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({
      data: makeDetailPR({
        head: { ref: "ai/my-feature" },
        labels: [{ name: "ai-generated" }],
      }),
    });
    mockPullsListCommits.mockResolvedValue({
      data: [
        { commit: { message: "Fix bug\n\nCo-Authored-By: Claude <noreply>" } },
      ],
    });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(classifyPullRequest).toHaveBeenCalledWith(
      { author: "octocat", branchName: "ai/my-feature", labels: ["ai-generated"] },
      [{ message: "Fix bug\n\nCo-Authored-By: Claude <noreply>" }],
      expect.any(Object),
    );
  });

  it("passes classification result to upsertPullRequest", async () => {
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });
    vi.mocked(classifyPullRequest).mockReturnValue("ai");

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(upsertPullRequest).toHaveBeenCalledWith(
      expect.objectContaining({ aiGenerated: "ai" }),
    );
  });

  it("passes 'mixed' classification through to upsert", async () => {
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });
    vi.mocked(classifyPullRequest).mockReturnValue("mixed");

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(upsertPullRequest).toHaveBeenCalledWith(
      expect.objectContaining({ aiGenerated: "mixed" }),
    );
  });

  it("defaults to 'human' when listCommits fails", async () => {
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });
    mockPullsListCommits.mockRejectedValue(new Error("Commits fetch failed"));

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(upsertPullRequest).toHaveBeenCalledWith(
      expect.objectContaining({ aiGenerated: "human" }),
    );
    // Sync should still succeed
    expect(completeSyncRun).toHaveBeenCalledWith(1, "success", 1, null, 0, 0);
  });

  it("loads custom heuristics config from settings", async () => {
    const customConfig = {
      coAuthorPatterns: ["*MyBot*"],
      authorBotList: ["custom-bot"],
      branchNamePatterns: ["bot/*"],
      labels: ["automated"],
      enabled: { coAuthor: true, authorBot: true, branchName: true, label: true },
    };
    vi.mocked(getSetting).mockReturnValue(JSON.stringify(customConfig));
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(classifyPullRequest).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Array),
      customConfig,
    );
  });

  it("uses default heuristics when settings returns null", async () => {
    vi.mocked(getSetting).mockReturnValue(null);
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(classifyPullRequest).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Array),
      expect.objectContaining({ coAuthorPatterns: expect.any(Array) }),
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

  it("filters out PRs created before sinceDate", async () => {
    const sinceDate = "2026-01-01T00:00:00Z";
    mockPaginate.mockResolvedValue([
      makeListItem({ number: 1, created_at: "2025-11-15T10:00:00Z" }), // before quarter
      makeListItem({ number: 2, id: 99999, created_at: "2026-02-01T10:00:00Z" }), // in quarter
    ]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR({ number: 2, id: 99999, created_at: "2026-02-01T10:00:00Z" }) });

    await syncPullRequests("owner", "repo", "ghp_token", 1, sinceDate);

    // Only PR #2 should be fetched and upserted
    expect(mockPullsGet).toHaveBeenCalledTimes(1);
    expect(mockPullsGet).toHaveBeenCalledWith({ owner: "owner", repo: "repo", pull_number: 2 });
    expect(upsertPullRequest).toHaveBeenCalledTimes(1);
  });

  it("includes all PRs when since is undefined (full sync)", async () => {
    mockPaginate.mockResolvedValue([
      makeListItem({ number: 1, created_at: "2024-01-01T10:00:00Z" }),
      makeListItem({ number: 2, id: 99999, created_at: "2025-06-01T10:00:00Z" }),
    ]);
    mockPullsGet
      .mockResolvedValueOnce({ data: makeDetailPR({ number: 1, created_at: "2024-01-01T10:00:00Z" }) })
      .mockResolvedValueOnce({ data: makeDetailPR({ number: 2, id: 99999, created_at: "2025-06-01T10:00:00Z" }) });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    // Both PRs should be fetched
    expect(mockPullsGet).toHaveBeenCalledTimes(2);
    expect(upsertPullRequest).toHaveBeenCalledTimes(2);
  });

  // US-2.06: Auto-classification after sync tests
  it("triggers auto-classification after successful sync when setting is enabled", async () => {
    vi.mocked(getSetting).mockImplementation((key: string) => {
      switch (key) {
        case "auto_classify_on_sync": return "true";
        case "llm_provider": return "anthropic";
        case "llm_model": return "claude-opus-4-6";
        case "llm_api_key": return "sk-xxx";
        default: return null;
      }
    });
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(classifyComments).toHaveBeenCalled();
  });

  it("triggers auto-classification when setting does not exist (default enabled)", async () => {
    vi.mocked(getSetting).mockImplementation((key: string) => {
      switch (key) {
        case "auto_classify_on_sync": return null;
        case "llm_provider": return "openai";
        case "llm_model": return "gpt-4o";
        case "llm_api_key": return "sk-xxx";
        default: return null;
      }
    });
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(classifyComments).toHaveBeenCalled();
  });

  it("does not trigger auto-classification when setting is disabled", async () => {
    vi.mocked(getSetting).mockImplementation((key: string) => {
      switch (key) {
        case "auto_classify_on_sync": return "false";
        case "llm_provider": return "anthropic";
        case "llm_model": return "claude-opus-4-6";
        case "llm_api_key": return "sk-xxx";
        default: return null;
      }
    });
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(classifyComments).not.toHaveBeenCalled();
  });

  it("does not trigger auto-classification when LLM is not configured", async () => {
    vi.mocked(getSetting).mockImplementation((key: string) => {
      switch (key) {
        case "auto_classify_on_sync": return "true";
        case "llm_provider": return null;
        case "llm_model": return null;
        case "llm_api_key": return null;
        default: return null;
      }
    });
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(classifyComments).not.toHaveBeenCalled();
  });

  it("does not trigger auto-classification when a classification is already running", async () => {
    vi.mocked(getSetting).mockImplementation((key: string) => {
      switch (key) {
        case "auto_classify_on_sync": return "true";
        case "llm_provider": return "anthropic";
        case "llm_model": return "claude-opus-4-6";
        case "llm_api_key": return "sk-xxx";
        default: return null;
      }
    });
    vi.mocked(getActiveClassificationRun).mockReturnValue({
      id: 99,
      status: "running",
      startedAt: "2024-06-01T10:00:00Z",
      completedAt: null,
      commentsProcessed: 5,
      errors: 0,
      modelUsed: "claude-opus-4-6",
    });
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(classifyComments).not.toHaveBeenCalled();
  });

  it("does not trigger auto-classification on sync error", async () => {
    vi.mocked(getSetting).mockImplementation((key: string) => {
      switch (key) {
        case "auto_classify_on_sync": return "true";
        case "llm_provider": return "anthropic";
        case "llm_model": return "claude-opus-4-6";
        case "llm_api_key": return "sk-xxx";
        default: return null;
      }
    });
    mockPaginate.mockRejectedValue(new Error("API rate limit exceeded"));

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(classifyComments).not.toHaveBeenCalled();
  });

  it("sync completes successfully even if classifyComments throws", async () => {
    vi.mocked(getSetting).mockImplementation((key: string) => {
      switch (key) {
        case "auto_classify_on_sync": return "true";
        case "llm_provider": return "anthropic";
        case "llm_model": return "claude-opus-4-6";
        case "llm_api_key": return "sk-xxx";
        default: return null;
      }
    });
    vi.mocked(classifyComments).mockRejectedValue(new Error("LLM service unavailable"));
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(completeSyncRun).toHaveBeenCalledWith(1, "success", 1, null, 0, 0);
    expect(classifyComments).toHaveBeenCalled();
  });

  // Team-scoped sync filtering tests
  it("filters out reviews from non-team members when team members exist", async () => {
    vi.mocked(getActiveTeamMemberUsernames).mockReturnValue(new Set(["reviewer1"]));
    setupOpenPRWithReviews([
      makeReview({ id: 200001, user: { login: "reviewer1" } }),
      makeReview({ id: 200002, user: { login: "external-user" } }),
    ]);

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(upsertReview).toHaveBeenCalledTimes(1);
    expect(upsertReview).toHaveBeenCalledWith(
      expect.objectContaining({ reviewer: "reviewer1" }),
    );
  });

  it("filters out review comments from non-team members when team members exist", async () => {
    vi.mocked(getActiveTeamMemberUsernames).mockReturnValue(new Set(["reviewer1"]));
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });
    vi.mocked(upsertPullRequest).mockReturnValue(defaultDbPR);
    mockPullsListReviews.mockResolvedValue({ data: [] });
    mockPullsListReviewComments.mockResolvedValue({
      data: [
        makeReviewComment({ id: 300001, user: { login: "reviewer1" } }),
        makeReviewComment({ id: 300002, user: { login: "external-bot" } }),
      ],
    });
    mockIssuesListComments.mockResolvedValue({ data: [] });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(upsertReviewComment).toHaveBeenCalledTimes(1);
    expect(upsertReviewComment).toHaveBeenCalledWith(
      expect.objectContaining({ reviewer: "reviewer1" }),
    );
  });

  it("filters out PR comments from non-team members when team members exist", async () => {
    vi.mocked(getActiveTeamMemberUsernames).mockReturnValue(new Set(["commenter1"]));
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });
    vi.mocked(upsertPullRequest).mockReturnValue(defaultDbPR);
    mockPullsListReviews.mockResolvedValue({ data: [] });
    mockPullsListReviewComments.mockResolvedValue({ data: [] });
    mockIssuesListComments.mockResolvedValue({
      data: [
        makePrComment({ id: 400001, user: { login: "commenter1" } }),
        makePrComment({ id: 400002, user: { login: "random-contributor" } }),
      ],
    });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(upsertPrComment).toHaveBeenCalledTimes(1);
    expect(upsertPrComment).toHaveBeenCalledWith(
      expect.objectContaining({ author: "commenter1" }),
    );
  });

  it("persists all reviews and comments when no team members exist (backward compatibility)", async () => {
    vi.mocked(getActiveTeamMemberUsernames).mockReturnValue(new Set());
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });
    vi.mocked(upsertPullRequest).mockReturnValue(defaultDbPR);
    mockPullsListReviews.mockResolvedValue({
      data: [makeReview({ user: { login: "anyone" } })],
    });
    mockPullsListReviewComments.mockResolvedValue({
      data: [makeReviewComment({ user: { login: "anyone" } })],
    });
    mockIssuesListComments.mockResolvedValue({
      data: [makePrComment({ user: { login: "anyone" } })],
    });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    expect(upsertReview).toHaveBeenCalledTimes(1);
    expect(upsertReviewComment).toHaveBeenCalledTimes(1);
    expect(upsertPrComment).toHaveBeenCalledTimes(1);
  });

  it("sync counts only include team member items when filtering is active", async () => {
    vi.mocked(getActiveTeamMemberUsernames).mockReturnValue(new Set(["reviewer1"]));
    mockPaginate.mockResolvedValue([makeListItem()]);
    mockPullsGet.mockResolvedValue({ data: makeDetailPR() });
    vi.mocked(upsertPullRequest).mockReturnValue(defaultDbPR);
    mockPullsListReviews.mockResolvedValue({
      data: [
        makeReview({ id: 200001, user: { login: "reviewer1" } }),
        makeReview({ id: 200002, user: { login: "external" } }),
      ],
    });
    mockPullsListReviewComments.mockResolvedValue({
      data: [
        makeReviewComment({ id: 300001, user: { login: "reviewer1" } }),
        makeReviewComment({ id: 300002, user: { login: "external" } }),
        makeReviewComment({ id: 300003, user: { login: "external2" } }),
      ],
    });
    mockIssuesListComments.mockResolvedValue({
      data: [
        makePrComment({ id: 400001, user: { login: "reviewer1" } }),
        makePrComment({ id: 400002, user: { login: "external" } }),
      ],
    });

    await syncPullRequests("owner", "repo", "ghp_token", 1);

    // 1 review (reviewer1), 2 comments (1 review comment + 1 PR comment from reviewer1)
    expect(completeSyncRun).toHaveBeenCalledWith(1, "success", 1, null, 1, 2);
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
