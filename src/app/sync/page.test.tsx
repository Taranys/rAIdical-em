// @vitest-environment jsdom
// US-010: Sync page component tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

import SyncPage from "./page";

function mockSyncStatus(syncRun: Record<string, unknown> | null) {
  return { syncRun };
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
      json: () => Promise.resolve(mockSyncStatus(null)),
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
        json: () => Promise.resolve(mockSyncStatus(null)),
      });
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText(/never synced/i)).toBeInTheDocument();
    });
  });

  it("shows up to date state after successful sync", async () => {
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
            mockSyncStatus({
              id: 1,
              status: "success",
              prCount: 42,
              startedAt: "2024-06-01T10:00:00Z",
              completedAt: "2024-06-01T10:05:00Z",
              errorMessage: null,
            }),
          ),
      });
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText(/up to date/i)).toBeInTheDocument();
      expect(screen.getByText(/42/)).toBeInTheDocument();
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
            mockSyncStatus({
              id: 1,
              status: "error",
              prCount: 10,
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
        json: () => Promise.resolve(mockSyncStatus(null)),
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
        json: () => Promise.resolve(mockSyncStatus(null)),
      });
    });

    render(<SyncPage />);

    await waitFor(() => {
      expect(screen.getByText(/4500/)).toBeInTheDocument();
      expect(screen.getByText(/5000/)).toBeInTheDocument();
    });
  });
});
