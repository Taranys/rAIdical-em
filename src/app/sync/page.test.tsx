// @vitest-environment jsdom
// US-010 + US-013: Sync page component tests
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

describe("SyncPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the page title", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSyncResponse(null)),
    });

    render(<SyncPage />);

    expect(screen.getByText("Sync")).toBeInTheDocument();
  });

  it("shows never synced state when no sync runs exist", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("rate-limit")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRateLimit({ limit: 5000, remaining: 4500, resetAt: "2024-06-01T11:00:00Z" })),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSyncResponse(null)),
      });
    });

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
      commentCount: 5,
      startedAt: "2024-06-01T10:00:00Z",
      completedAt: "2024-06-01T10:05:00Z",
      errorMessage: null,
    };
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("rate-limit")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRateLimit({ limit: 5000, remaining: 4500, resetAt: "2024-06-01T11:00:00Z" })),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSyncResponse(syncRun, [syncRun])),
      });
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText(/up to date/i)).toBeInTheDocument();
      expect(screen.getByText(/42 PRs, 5 comments synced/)).toBeInTheDocument();
    });
  });

  it("shows error state with error message", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("rate-limit")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRateLimit({ limit: 5000, remaining: 4500, resetAt: "2024-06-01T11:00:00Z" })),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            mockSyncResponse({
              id: 1,
              status: "error",
              prCount: 10,
              commentCount: 0,
              startedAt: "2024-06-01T10:00:00Z",
              completedAt: "2024-06-01T10:01:00Z",
              errorMessage: "Rate limit exceeded",
            }),
          ),
      });
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
          json: () => Promise.resolve(mockRateLimit({ limit: 5000, remaining: 4500, resetAt: "2024-06-01T11:00:00Z" })),
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
      expect(mockFetch).toHaveBeenCalledWith("/api/sync", expect.objectContaining({ method: "POST" }));
    });
  });

  it("shows rate limit information", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("rate-limit")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve(
              mockRateLimit({
                limit: 5000,
                remaining: 4500,
                resetAt: "2024-06-01T11:00:00Z",
              }),
            ),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSyncResponse(null)),
      });
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
      { id: 3, status: "success", prCount: 50, commentCount: 10, startedAt: "2024-06-03T10:00:00Z", completedAt: "2024-06-03T10:05:00Z", errorMessage: null },
      { id: 2, status: "error", prCount: 5, commentCount: 0, startedAt: "2024-06-02T10:00:00Z", completedAt: "2024-06-02T10:01:00Z", errorMessage: "Error" },
      { id: 1, status: "success", prCount: 20, commentCount: 3, startedAt: "2024-06-01T10:00:00Z", completedAt: "2024-06-01T10:03:00Z", errorMessage: null },
    ];

    mockFetch.mockImplementation((url: string) => {
      if (url.includes("rate-limit")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRateLimit(null)),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSyncResponse(history[0], history)),
      });
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
      commentCount: 15,
      startedAt: "2024-06-01T10:00:00Z",
      completedAt: "2024-06-01T10:05:00Z",
      errorMessage: null,
    };

    mockFetch.mockImplementation((url: string) => {
      if (url.includes("rate-limit")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRateLimit(null)),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSyncResponse(syncRun, [syncRun])),
      });
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText(/15 comments/)).toBeInTheDocument();
    });
  });

  it("shows empty state when no sync history", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("rate-limit")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRateLimit(null)),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSyncResponse(null, [])),
      });
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText("No sync history yet.")).toBeInTheDocument();
    });
  });
});
