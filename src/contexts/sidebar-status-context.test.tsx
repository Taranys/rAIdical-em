// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { SidebarStatusProvider, useSidebarStatusContext } from "./sidebar-status-context";
import type { ReactNode } from "react";

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

function wrapper({ children }: { children: ReactNode }) {
  return <SidebarStatusProvider>{children}</SidebarStatusProvider>;
}

describe("SidebarStatusProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("provides status from API on mount", async () => {
    mockFetch.mockResolvedValue(mockApiResponse(ALL_CONFIGURED));

    const { result } = renderHook(() => useSidebarStatusContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.status.settings.configured).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/sidebar-status");
    expect(result.current.status.team.configured).toBe(true);
  });

  it("refresh() triggers a re-fetch and updates status", async () => {
    mockFetch
      .mockResolvedValueOnce(mockApiResponse(NOTHING_CONFIGURED))
      .mockResolvedValueOnce(mockApiResponse(ALL_CONFIGURED));

    const { result } = renderHook(() => useSidebarStatusContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.status.settings.configured).toBe(false);
    });

    const callsBefore = mockFetch.mock.calls.length;

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockFetch.mock.calls.length).toBe(callsBefore + 1);

    await waitFor(() => {
      expect(result.current.status.settings.configured).toBe(true);
    });
  });

  it("sync polling is not disrupted by manual refresh() calls", async () => {
    const completedResponse = {
      ...ALL_CONFIGURED,
      sync: { hasRun: true, status: "success" },
    };

    mockFetch
      .mockResolvedValueOnce(mockApiResponse(SYNC_RUNNING)) // initial mount
      .mockResolvedValueOnce(mockApiResponse(SYNC_RUNNING)) // manual refresh
      .mockResolvedValue(mockApiResponse(completedResponse)); // polling + subsequent

    const { result } = renderHook(() => useSidebarStatusContext(), { wrapper });

    // Wait for initial sync running state
    await waitFor(() => {
      expect(result.current.status.sync.status).toBe("running");
    });

    // Call refresh() manually — should not break polling
    await act(async () => {
      await result.current.refresh();
    });

    // Polling should still work — advance timer
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Polling should have fetched again and detected completion
    await waitFor(() => {
      expect(result.current.status.sync.status).toBe("success");
    });
  });

  it("throws when used outside provider", () => {
    // Suppress console.error from React for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useSidebarStatusContext());
    }).toThrow("useSidebarStatusContext must be used within a SidebarStatusProvider");

    consoleSpy.mockRestore();
  });
});
