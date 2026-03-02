// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useSidebarStatus } from "./use-sidebar-status";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockApiResponse(data: Record<string, unknown>) {
  return {
    ok: true,
    json: () => Promise.resolve(data),
  };
}

const ALL_CONFIGURED = {
  settings: { configured: true },
  team: { configured: true },
  sync: { hasRun: true, status: "success" },
};

const NOTHING_CONFIGURED = {
  settings: { configured: false },
  team: { configured: false },
  sync: { hasRun: false, status: null },
};

const SYNC_RUNNING = {
  settings: { configured: true },
  team: { configured: true },
  sync: { hasRun: true, status: "running" },
};

describe("useSidebarStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches sidebar status on mount", async () => {
    mockFetch.mockResolvedValue(mockApiResponse(ALL_CONFIGURED));

    const { result } = renderHook(() => useSidebarStatus());

    await waitFor(() => {
      expect(result.current.settings.configured).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/sidebar-status");
    expect(result.current.team.configured).toBe(true);
    expect(result.current.sync).toEqual({ hasRun: true, status: "success" });
  });

  it("returns initial unconfigured state before fetch completes", () => {
    mockFetch.mockResolvedValue(mockApiResponse(ALL_CONFIGURED));

    const { result } = renderHook(() => useSidebarStatus());

    expect(result.current.settings.configured).toBe(false);
    expect(result.current.team.configured).toBe(false);
    expect(result.current.sync.status).toBeNull();
  });

  it("starts polling when sync is running", async () => {
    mockFetch.mockResolvedValue(mockApiResponse(SYNC_RUNNING));

    const { result } = renderHook(() => useSidebarStatus());

    await waitFor(() => {
      expect(result.current.sync.status).toBe("running");
    });

    const callsBefore = mockFetch.mock.calls.length;

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockFetch.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it("stops polling when sync completes", async () => {
    const completedResponse = {
      ...ALL_CONFIGURED,
      sync: { hasRun: true, status: "success" },
    };

    mockFetch
      .mockResolvedValueOnce(mockApiResponse(SYNC_RUNNING))
      .mockResolvedValue(mockApiResponse(completedResponse));

    const { result } = renderHook(() => useSidebarStatus());

    await waitFor(() => {
      expect(result.current.sync.status).toBe("running");
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.sync.status).toBe("success");
    });

    const callsAfterStop = mockFetch.mock.calls.length;

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockFetch.mock.calls.length).toBe(callsAfterStop);
  });

  it("handles fetch errors gracefully", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useSidebarStatus());

    // Should keep initial state on error
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.settings.configured).toBe(false);
    expect(result.current.team.configured).toBe(false);
  });
});
