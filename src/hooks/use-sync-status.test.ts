// @vitest-environment jsdom
// US-013: useSyncStatus hook tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useSyncStatus } from "./use-sync-status";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockApiResponse(
  syncRun: Record<string, unknown> | null,
  history: Record<string, unknown>[] = [],
) {
  return {
    ok: true,
    json: () => Promise.resolve({ syncRun, history }),
  };
}

describe("useSyncStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns isLoading true initially", () => {
    mockFetch.mockResolvedValue(mockApiResponse(null));

    const { result } = renderHook(() => useSyncStatus());

    expect(result.current.isLoading).toBe(true);
  });

  it("fetches sync status on mount", async () => {
    const syncRun = {
      id: 1,
      status: "success",
      prCount: 42,
      commentCount: 5,
      startedAt: "2024-06-01T10:00:00Z",
      completedAt: "2024-06-01T10:05:00Z",
      errorMessage: null,
    };
    mockFetch.mockResolvedValue(mockApiResponse(syncRun, [syncRun]));

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.syncRun).toEqual(syncRun);
    expect(mockFetch).toHaveBeenCalledWith("/api/sync");
  });

  it("returns history from API response", async () => {
    const runs = [
      { id: 2, status: "success", prCount: 50, commentCount: 10, startedAt: "2024-06-02T10:00:00Z", completedAt: "2024-06-02T10:05:00Z", errorMessage: null },
      { id: 1, status: "error", prCount: 5, commentCount: 0, startedAt: "2024-06-01T10:00:00Z", completedAt: "2024-06-01T10:01:00Z", errorMessage: "Error" },
    ];
    mockFetch.mockResolvedValue(mockApiResponse(runs[0], runs));

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0].id).toBe(2);
  });

  it("starts polling when sync is running", async () => {
    const runningRun = {
      id: 1,
      status: "running",
      prCount: 5,
      commentCount: 0,
      startedAt: "2024-06-01T10:00:00Z",
      completedAt: null,
      errorMessage: null,
    };
    mockFetch.mockResolvedValue(mockApiResponse(runningRun));

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Initial fetch + at least one poll
    const callsBefore = mockFetch.mock.calls.length;

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockFetch.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it("stops polling when sync completes", async () => {
    const runningRun = {
      id: 1,
      status: "running",
      prCount: 5,
      commentCount: 0,
      startedAt: "2024-06-01T10:00:00Z",
      completedAt: null,
      errorMessage: null,
    };
    const completedRun = {
      ...runningRun,
      status: "success",
      prCount: 42,
      completedAt: "2024-06-01T10:05:00Z",
    };

    // First call returns running, subsequent calls return completed
    mockFetch
      .mockResolvedValueOnce(mockApiResponse(runningRun))
      .mockResolvedValue(mockApiResponse(completedRun));

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Advance past one poll interval
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.syncRun?.status).toBe("success");
    });

    const callsAfterStop = mockFetch.mock.calls.length;

    // Advance more — no new calls (polling stopped)
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(mockFetch.mock.calls.length).toBe(callsAfterStop);
  });

  it("does not fetch on mount when fetchOnMount is false", async () => {
    mockFetch.mockResolvedValue(mockApiResponse(null));

    renderHook(() => useSyncStatus({ fetchOnMount: false }));

    // Wait a tick
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
