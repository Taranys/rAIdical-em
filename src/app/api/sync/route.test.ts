// US-010: Sync API route unit tests
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSyncPullRequests } = vi.hoisted(() => ({
  mockSyncPullRequests: vi.fn(),
}));

vi.mock("@/db/settings");
vi.mock("@/db/pull-requests");
vi.mock("@/db/sync-runs");
vi.mock("@/lib/sync-service", () => ({
  syncPullRequests: mockSyncPullRequests,
}));
vi.mock("octokit", () => ({
  Octokit: class MockOctokit {},
}));

import { POST } from "./route";
import * as settingsDAL from "@/db/settings";
import * as syncRunsDAL from "@/db/sync-runs";

async function readSSEEvents(response: Response) {
  const text = await response.text();
  return text
    .split("\n\n")
    .filter(Boolean)
    .map((block) => {
      const eventMatch = block.match(/event: (.+)/);
      const dataMatch = block.match(/data: (.+)/);
      return {
        event: eventMatch?.[1] ?? null,
        data: dataMatch ? JSON.parse(dataMatch[1]) : null,
      };
    });
}

describe("POST /api/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when no PAT configured", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue(null);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/PAT|repository|configured/i);
  });

  it("returns 400 when no repository configured", async () => {
    vi.mocked(settingsDAL.getSetting).mockImplementation((key: string) => {
      if (key === "github_pat") return "ghp_test";
      return null;
    });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/PAT|repository|configured/i);
  });

  it("returns SSE stream with start and complete events on success", async () => {
    vi.mocked(settingsDAL.getSetting).mockImplementation((key: string) => {
      if (key === "github_pat") return "ghp_test";
      if (key === "github_owner") return "myorg";
      if (key === "github_repo") return "myrepo";
      return null;
    });

    vi.mocked(syncRunsDAL.createSyncRun).mockReturnValue({
      id: 1,
      repository: "myorg/myrepo",
      startedAt: "2024-01-01T00:00:00Z",
      completedAt: null,
      status: "running",
      prCount: 0,
      commentCount: 0,
      errorMessage: null,
    });

    mockSyncPullRequests.mockResolvedValue({ prCount: 42, durationMs: 1500 });

    const response = await POST();
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");

    const events = await readSSEEvents(response);

    const startEvent = events.find((e) => e.event === "sync:start");
    expect(startEvent).toBeTruthy();
    expect(startEvent!.data.syncRunId).toBe(1);
    expect(startEvent!.data.repository).toBe("myorg/myrepo");

    const completeEvent = events.find((e) => e.event === "sync:complete");
    expect(completeEvent).toBeTruthy();
    expect(completeEvent!.data.prCount).toBe(42);
    expect(completeEvent!.data.durationMs).toBe(1500);
  });

  it("calls createSyncRun and completeSyncRun on success", async () => {
    vi.mocked(settingsDAL.getSetting).mockImplementation((key: string) => {
      if (key === "github_pat") return "ghp_test";
      if (key === "github_owner") return "myorg";
      if (key === "github_repo") return "myrepo";
      return null;
    });

    vi.mocked(syncRunsDAL.createSyncRun).mockReturnValue({
      id: 1,
      repository: "myorg/myrepo",
      startedAt: "2024-01-01T00:00:00Z",
      completedAt: null,
      status: "running",
      prCount: 0,
      commentCount: 0,
      errorMessage: null,
    });

    mockSyncPullRequests.mockResolvedValue({ prCount: 10, durationMs: 500 });

    const response = await POST();
    await response.text(); // consume stream

    expect(syncRunsDAL.createSyncRun).toHaveBeenCalledWith("myorg/myrepo");
    expect(syncRunsDAL.completeSyncRun).toHaveBeenCalledWith(1, 10);
  });

  it("returns SSE stream with error event on failure", async () => {
    vi.mocked(settingsDAL.getSetting).mockImplementation((key: string) => {
      if (key === "github_pat") return "ghp_test";
      if (key === "github_owner") return "myorg";
      if (key === "github_repo") return "myrepo";
      return null;
    });

    vi.mocked(syncRunsDAL.createSyncRun).mockReturnValue({
      id: 1,
      repository: "myorg/myrepo",
      startedAt: "2024-01-01T00:00:00Z",
      completedAt: null,
      status: "running",
      prCount: 0,
      commentCount: 0,
      errorMessage: null,
    });

    mockSyncPullRequests.mockRejectedValue(new Error("API rate limit exceeded"));

    const response = await POST();
    const events = await readSSEEvents(response);

    const errorEvent = events.find((e) => e.event === "sync:error");
    expect(errorEvent).toBeTruthy();
    expect(errorEvent!.data.message).toBe("API rate limit exceeded");
  });

  it("calls failSyncRun on error", async () => {
    vi.mocked(settingsDAL.getSetting).mockImplementation((key: string) => {
      if (key === "github_pat") return "ghp_test";
      if (key === "github_owner") return "myorg";
      if (key === "github_repo") return "myrepo";
      return null;
    });

    vi.mocked(syncRunsDAL.createSyncRun).mockReturnValue({
      id: 1,
      repository: "myorg/myrepo",
      startedAt: "2024-01-01T00:00:00Z",
      completedAt: null,
      status: "running",
      prCount: 0,
      commentCount: 0,
      errorMessage: null,
    });

    mockSyncPullRequests.mockRejectedValue(new Error("Network error"));

    const response = await POST();
    await response.text(); // consume stream

    expect(syncRunsDAL.failSyncRun).toHaveBeenCalledWith(1, "Network error");
  });
});
