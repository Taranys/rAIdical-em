// US-010: Sync service unit tests
import { describe, it, expect, vi } from "vitest";
import { mapPullRequest, syncPullRequests } from "./sync-service";
import type { PullRequestInput } from "@/db/pull-requests";

function makeGitHubPR(overrides: Record<string, unknown> = {}) {
  return {
    id: 123456,
    number: 42,
    title: "Add feature X",
    user: { login: "octocat" },
    state: "open" as const,
    created_at: "2024-06-01T10:00:00Z",
    merged_at: null,
    additions: 100,
    deletions: 20,
    changed_files: 5,
    ...overrides,
  };
}

describe("mapPullRequest", () => {
  it("maps an open PR correctly", () => {
    const result = mapPullRequest(makeGitHubPR());

    expect(result.githubId).toBe(123456);
    expect(result.number).toBe(42);
    expect(result.title).toBe("Add feature X");
    expect(result.author).toBe("octocat");
    expect(result.state).toBe("open");
    expect(result.createdAt).toBe("2024-06-01T10:00:00Z");
    expect(result.mergedAt).toBeNull();
    expect(result.additions).toBe(100);
    expect(result.deletions).toBe(20);
    expect(result.changedFiles).toBe(5);
    expect(result.aiGenerated).toBe("human");
  });

  it("maps a closed-and-merged PR to state 'merged'", () => {
    const result = mapPullRequest(
      makeGitHubPR({
        state: "closed",
        merged_at: "2024-06-02T12:00:00Z",
      }),
    );

    expect(result.state).toBe("merged");
    expect(result.mergedAt).toBe("2024-06-02T12:00:00Z");
  });

  it("maps a closed-but-not-merged PR to state 'closed'", () => {
    const result = mapPullRequest(
      makeGitHubPR({ state: "closed", merged_at: null }),
    );

    expect(result.state).toBe("closed");
    expect(result.mergedAt).toBeNull();
  });

  it("defaults author to 'unknown' when user is null", () => {
    const result = mapPullRequest(makeGitHubPR({ user: null }));
    expect(result.author).toBe("unknown");
  });

  it("defaults additions/deletions/changedFiles to 0 when absent", () => {
    const result = mapPullRequest(
      makeGitHubPR({
        additions: undefined,
        deletions: undefined,
        changed_files: undefined,
      }),
    );

    expect(result.additions).toBe(0);
    expect(result.deletions).toBe(0);
    expect(result.changedFiles).toBe(0);
  });
});

describe("syncPullRequests", () => {
  function makeMockOctokit(pages: Record<string, unknown>[][]) {
    return {
      paginate: {
        iterator: () => ({
          async *[Symbol.asyncIterator]() {
            for (const page of pages) {
              yield { data: page };
            }
          },
        }),
      },
      rest: {
        pulls: {
          list: vi.fn(),
        },
      },
    };
  }

  it("iterates pages and calls upsertBatch per page", async () => {
    const page1 = [makeGitHubPR({ id: 1, number: 1 })];
    const page2 = [
      makeGitHubPR({ id: 2, number: 2 }),
      makeGitHubPR({ id: 3, number: 3 }),
    ];
    const octokit = makeMockOctokit([page1, page2]);
    const upsertBatch = vi.fn();
    const onProgress = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await syncPullRequests(octokit as any, "owner", "repo", upsertBatch, {
      onProgress,
      onError: vi.fn(),
    });

    expect(upsertBatch).toHaveBeenCalledTimes(2);
    expect(upsertBatch.mock.calls[0][0]).toHaveLength(1);
    expect(upsertBatch.mock.calls[1][0]).toHaveLength(2);
    expect(result.prCount).toBe(3);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("reports progress after each page", async () => {
    const page1 = [makeGitHubPR({ id: 1, number: 1 })];
    const page2 = [makeGitHubPR({ id: 2, number: 2 })];
    const octokit = makeMockOctokit([page1, page2]);
    const onProgress = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await syncPullRequests(octokit as any, "owner", "repo", vi.fn(), {
      onProgress,
      onError: vi.fn(),
    });

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenCalledWith({ fetched: 1, currentPage: 1 });
    expect(onProgress).toHaveBeenCalledWith({ fetched: 2, currentPage: 2 });
  });

  it("returns correct total count and duration", async () => {
    const octokit = makeMockOctokit([
      [makeGitHubPR({ id: 1, number: 1 })],
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await syncPullRequests(octokit as any, "owner", "repo", vi.fn(), {
      onProgress: vi.fn(),
      onError: vi.fn(),
    });

    expect(result.prCount).toBe(1);
    expect(typeof result.durationMs).toBe("number");
  });

  it("handles empty repository (no PRs)", async () => {
    const octokit = makeMockOctokit([]);
    const upsertBatch = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await syncPullRequests(octokit as any, "owner", "repo", upsertBatch, {
      onProgress: vi.fn(),
      onError: vi.fn(),
    });

    expect(upsertBatch).not.toHaveBeenCalled();
    expect(result.prCount).toBe(0);
  });

  it("maps each PR through mapPullRequest before upserting", async () => {
    const octokit = makeMockOctokit([
      [makeGitHubPR({ id: 1, number: 1, state: "closed", merged_at: "2024-01-01T00:00:00Z" })],
    ]);
    const upsertBatch = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await syncPullRequests(octokit as any, "owner", "repo", upsertBatch, {
      onProgress: vi.fn(),
      onError: vi.fn(),
    });

    const upsertedPRs: PullRequestInput[] = upsertBatch.mock.calls[0][0];
    expect(upsertedPRs[0].state).toBe("merged");
  });
});
