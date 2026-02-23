// @vitest-environment jsdom
// US-010 + US-011 + US-013 + US-025 + US-2.06: Sync page component tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

import SyncPage from "./page";

function mockSyncResponse(
  syncRun: Record<string, unknown> | null,
  history: Record<string, unknown>[] = [],
) {
  return { syncRun, history };
}

function mockRateLimit(rateLimit: Record<string, unknown> | null) {
  return rateLimit ? { rateLimit } : { error: "No PAT" };
}

function mockTeamMembers(members: Record<string, unknown>[] = []) {
  return { members };
}

function mockProgress(
  teamProgress: Record<string, unknown>[] = [],
  nonTeamCount = 0,
  totalCount = 0,
) {
  return { teamProgress, nonTeamCount, totalCount };
}

// US-2.06: Classification progress mock
function mockClassifyProgress(
  run: Record<string, unknown> | null = null,
) {
  return { run, summary: null, history: [] };
}

// Default mock that handles all endpoints
function setupDefaultMocks(overrides: {
  syncResponse?: ReturnType<typeof mockSyncResponse>;
  rateLimitResponse?: ReturnType<typeof mockRateLimit>;
  teamMembersResponse?: ReturnType<typeof mockTeamMembers>;
  progressResponse?: ReturnType<typeof mockProgress>;
  classifyProgressResponse?: ReturnType<typeof mockClassifyProgress>;
} = {}) {
  const syncResp = overrides.syncResponse ?? mockSyncResponse(null);
  const rateLimitResp = overrides.rateLimitResponse ?? mockRateLimit(null);
  const teamResp = overrides.teamMembersResponse ?? mockTeamMembers([
    { id: 1, githubUsername: "alice", displayName: "Alice" },
  ]);
  const progressResp = overrides.progressResponse ?? mockProgress();
  const classifyResp = overrides.classifyProgressResponse ?? mockClassifyProgress();

  mockFetch.mockImplementation((url: string) => {
    if (url.includes("rate-limit")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(rateLimitResp),
      });
    }
    if (url.includes("/api/classify/progress")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(classifyResp),
      });
    }
    if (url.includes("/api/sync/progress")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(progressResp),
      });
    }
    if (url.includes("/api/team")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(teamResp),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(syncResp),
    });
  });
}

describe("SyncPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the page title", async () => {
    setupDefaultMocks();

    render(<SyncPage />);

    expect(screen.getByText("Sync")).toBeInTheDocument();
  });

  it("shows never synced state when no sync runs exist", async () => {
    setupDefaultMocks();

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText(/never synced/i)).toBeInTheDocument();
    });
  });

  it("shows up to date state after successful sync", async () => {
    const syncRun = {
      id: 1,
      status: "success",
      prCount: 42,
      reviewCount: 10,
      commentCount: 5,
      startedAt: "2024-06-01T10:00:00Z",
      completedAt: "2024-06-01T10:05:00Z",
      errorMessage: null,
    };
    setupDefaultMocks({
      syncResponse: mockSyncResponse(syncRun, [syncRun]),
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText(/up to date/i)).toBeInTheDocument();
      expect(screen.getByText(/42 PRs, 10 reviews, 5 comments synced/)).toBeInTheDocument();
    });
  });

  it("shows error state with error message", async () => {
    setupDefaultMocks({
      syncResponse: mockSyncResponse({
        id: 1,
        status: "error",
        prCount: 10,
        reviewCount: 0,
        commentCount: 0,
        startedAt: "2024-06-01T10:00:00Z",
        completedAt: "2024-06-01T10:01:00Z",
        errorMessage: "Rate limit exceeded",
      }),
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText("Sync error")).toBeInTheDocument();
      expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
    });
  });

  it("triggers sync when clicking Sync Now button", async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url.includes("rate-limit")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRateLimit(null)),
        });
      }
      if (url.includes("/api/team")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTeamMembers([
            { id: 1, githubUsername: "alice", displayName: "Alice" },
          ])),
        });
      }
      if (url.includes("/api/sync/progress")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProgress()),
        });
      }
      if (opts?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, syncRunId: 1 }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSyncResponse(null)),
      });
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sync now/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /sync now/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/sync",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  // US-011: Review count display tests
  it("shows review count in success state", async () => {
    const syncRun = {
      id: 1,
      status: "success",
      prCount: 42,
      reviewCount: 120,
      commentCount: 5,
      startedAt: "2024-06-01T10:00:00Z",
      completedAt: "2024-06-01T10:05:00Z",
      errorMessage: null,
    };
    setupDefaultMocks({
      syncResponse: mockSyncResponse(syncRun, [syncRun]),
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText(/42 PRs/)).toBeInTheDocument();
      expect(screen.getByText(/120 reviews/)).toBeInTheDocument();
    });
  });

  it("shows review count in running state", async () => {
    setupDefaultMocks({
      syncResponse: mockSyncResponse({
        id: 1,
        status: "running",
        prCount: 10,
        reviewCount: 25,
        commentCount: 3,
        startedAt: "2024-06-01T10:00:00Z",
        completedAt: null,
        errorMessage: null,
      }),
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText(/10 PRs/)).toBeInTheDocument();
      expect(screen.getByText(/25 reviews/)).toBeInTheDocument();
    });
  });

  it("shows rate limit information", async () => {
    setupDefaultMocks({
      rateLimitResponse: mockRateLimit({
        limit: 5000,
        remaining: 4500,
        resetAt: "2024-06-01T11:00:00Z",
      }),
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText(/4500/)).toBeInTheDocument();
      expect(screen.getByText(/5000/)).toBeInTheDocument();
    });
  });

  // US-013: Sync history tests
  it("shows sync history table with runs", async () => {
    const history = [
      { id: 3, status: "success", prCount: 50, reviewCount: 15, commentCount: 10, startedAt: "2024-06-03T10:00:00Z", completedAt: "2024-06-03T10:05:00Z", errorMessage: null },
      { id: 2, status: "error", prCount: 5, reviewCount: 0, commentCount: 0, startedAt: "2024-06-02T10:00:00Z", completedAt: "2024-06-02T10:01:00Z", errorMessage: "Error" },
      { id: 1, status: "success", prCount: 20, reviewCount: 8, commentCount: 3, startedAt: "2024-06-01T10:00:00Z", completedAt: "2024-06-01T10:03:00Z", errorMessage: null },
    ];

    setupDefaultMocks({
      syncResponse: mockSyncResponse(history[0], history),
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText("Sync History")).toBeInTheDocument();
    });

    // Table should have rows for each history run
    const rows = screen.getAllByRole("row");
    // 1 header row + 3 data rows
    expect(rows.length).toBe(4);
  });

  it("shows comment count in status indicator", async () => {
    const syncRun = {
      id: 1,
      status: "success",
      prCount: 42,
      reviewCount: 10,
      commentCount: 15,
      startedAt: "2024-06-01T10:00:00Z",
      completedAt: "2024-06-01T10:05:00Z",
      errorMessage: null,
    };
    setupDefaultMocks({
      syncResponse: mockSyncResponse(syncRun, [syncRun]),
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText(/15 comments/)).toBeInTheDocument();
    });
  });

  it("shows empty state when no sync history", async () => {
    setupDefaultMocks();

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText("No sync history yet.")).toBeInTheDocument();
    });
  });

  // US-025: Quarter selector and team member check tests
  it("shows no team members message when team is empty", async () => {
    setupDefaultMocks({
      teamMembersResponse: mockTeamMembers([]),
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText(/No team members configured/)).toBeInTheDocument();
      expect(screen.getByText(/Add team members/)).toBeInTheDocument();
    });
  });

  it("disables sync button when no team members", async () => {
    setupDefaultMocks({
      teamMembersResponse: mockTeamMembers([]),
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sync now/i })).toBeDisabled();
    });
  });

  it("renders quarter selector", async () => {
    setupDefaultMocks();

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByTestId("quarter-selector")).toBeInTheDocument();
    });
  });

  // US-2.06: Classification status card tests
  it("shows classification status card when a classification run exists", async () => {
    setupDefaultMocks({
      classifyProgressResponse: mockClassifyProgress({
        id: 1,
        status: "success",
        commentsProcessed: 15,
        errors: 0,
        startedAt: "2024-06-01T10:05:00Z",
        completedAt: "2024-06-01T10:06:00Z",
        modelUsed: "claude-opus-4-6",
      }),
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText("Comment Classification")).toBeInTheDocument();
      expect(screen.getByText("Classification complete")).toBeInTheDocument();
      expect(screen.getByText(/15 comments classified/)).toBeInTheDocument();
    });
  });

  it("shows classification running state with spinner", async () => {
    setupDefaultMocks({
      classifyProgressResponse: mockClassifyProgress({
        id: 1,
        status: "running",
        commentsProcessed: 5,
        errors: 0,
        startedAt: "2024-06-01T10:05:00Z",
        completedAt: null,
        modelUsed: "claude-opus-4-6",
      }),
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText("Classifying comments...")).toBeInTheDocument();
      expect(screen.getByText(/5 comments classified so far/)).toBeInTheDocument();
    });
  });

  it("shows classification error state", async () => {
    setupDefaultMocks({
      classifyProgressResponse: mockClassifyProgress({
        id: 1,
        status: "error",
        commentsProcessed: 3,
        errors: 7,
        startedAt: "2024-06-01T10:05:00Z",
        completedAt: "2024-06-01T10:06:00Z",
        modelUsed: "claude-opus-4-6",
      }),
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText("Classification error")).toBeInTheDocument();
      expect(screen.getByText(/3 classified, 7 errors/)).toBeInTheDocument();
    });
  });

  it("does not show classification card when no run exists", async () => {
    setupDefaultMocks({
      classifyProgressResponse: mockClassifyProgress(null),
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText("Sync")).toBeInTheDocument();
    });

    expect(screen.queryByText("Comment Classification")).not.toBeInTheDocument();
  });
});
