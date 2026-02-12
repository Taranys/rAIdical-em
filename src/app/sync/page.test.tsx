// @vitest-environment jsdom
// US-010: Unit tests for sync page
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import SyncPage from "./page";

function createSSEStream(events: { event: string; data: unknown }[]) {
  const text = events
    .map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}`)
    .join("\n\n") + "\n\n";
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
  return stream;
}

function mockFetchWithConfig(
  configResponse: { configured: boolean; owner?: string; repo?: string },
  sseEvents?: { event: string; data: unknown }[],
) {
  return vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/settings/github-repo" && (!init || init.method === "GET" || !init.method)) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(configResponse),
      });
    }
    if (url === "/api/sync" && init?.method === "POST" && sseEvents) {
      return Promise.resolve({
        ok: true,
        status: 200,
        body: createSSEStream(sseEvents),
      });
    }
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Not found" }),
    });
  }) as unknown as typeof globalThis.fetch;
}

describe("SyncPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the page heading", () => {
    globalThis.fetch = mockFetchWithConfig({
      configured: true,
      owner: "myorg",
      repo: "myrepo",
    });
    render(<SyncPage />);
    expect(screen.getByText("Sync")).toBeInTheDocument();
  });

  it("renders the start sync button when repo is configured", async () => {
    globalThis.fetch = mockFetchWithConfig({
      configured: true,
      owner: "myorg",
      repo: "myrepo",
    });
    render(<SyncPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /start sync/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows message when repository is not configured", async () => {
    globalThis.fetch = mockFetchWithConfig({ configured: false });
    render(<SyncPage />);
    await waitFor(() => {
      expect(screen.getByText(/configure.*repository/i)).toBeInTheDocument();
    });
  });

  it("disables button while syncing", async () => {
    // Use a fetch that returns a stream that never resolves quickly
    globalThis.fetch = mockFetchWithConfig(
      { configured: true, owner: "myorg", repo: "myrepo" },
      [
        { event: "sync:start", data: { syncRunId: 1, repository: "myorg/myrepo" } },
        { event: "sync:complete", data: { syncRunId: 1, prCount: 5, durationMs: 100 } },
      ],
    );

    render(<SyncPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /start sync/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /start sync/i }));

    // Button should show syncing state
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /syncing/i })).toBeDisabled();
    });
  });

  it("shows success state on completion", async () => {
    globalThis.fetch = mockFetchWithConfig(
      { configured: true, owner: "myorg", repo: "myrepo" },
      [
        { event: "sync:start", data: { syncRunId: 1, repository: "myorg/myrepo" } },
        { event: "sync:progress", data: { fetched: 42, currentPage: 1 } },
        { event: "sync:complete", data: { syncRunId: 1, prCount: 42, durationMs: 1500 } },
      ],
    );

    render(<SyncPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /start sync/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /start sync/i }));

    await waitFor(() => {
      expect(screen.getByText(/42/)).toBeInTheDocument();
    });
  });

  it("shows error state on failure", async () => {
    globalThis.fetch = mockFetchWithConfig(
      { configured: true, owner: "myorg", repo: "myrepo" },
      [
        { event: "sync:start", data: { syncRunId: 1, repository: "myorg/myrepo" } },
        { event: "sync:error", data: { message: "Rate limit exceeded", syncRunId: 1 } },
      ],
    );

    render(<SyncPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /start sync/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /start sync/i }));

    await waitFor(() => {
      expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
    });
  });
});
