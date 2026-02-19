// US-010 / US-014 / US-025: Sync API route unit tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/settings", () => ({
  getSetting: vi.fn(),
}));

vi.mock("@/db/sync-runs", () => ({
  createSyncRun: vi.fn(),
  getLatestSyncRun: vi.fn(),
  getLatestSuccessfulSyncRun: vi.fn(),
  getActiveSyncRun: vi.fn(),
  getSyncRunHistory: vi.fn(),
}));

vi.mock("@/lib/github-sync", () => ({
  syncPullRequests: vi.fn(),
}));

import { GET, POST } from "./route";
import { getSetting } from "@/db/settings";
import {
  createSyncRun,
  getLatestSyncRun,
  getLatestSuccessfulSyncRun,
  getActiveSyncRun,
  getSyncRunHistory,
} from "@/db/sync-runs";
import { syncPullRequests } from "@/lib/github-sync";

function setupValidSettings() {
  vi.mocked(getSetting).mockImplementation((key: string) => {
    if (key === "github_pat") return "ghp_token";
    if (key === "github_owner") return "owner";
    if (key === "github_repo") return "repo";
    return null;
  });
}

// US-025: Helper to create a Request with JSON body
function createPostRequest(body?: Record<string, unknown>) {
  if (body) {
    return new Request("http://localhost/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  return new Request("http://localhost/api/sync", { method: "POST" });
}

const mockSyncRun = {
  id: 42,
  repository: "owner/repo",
  startedAt: "2024-06-01T10:00:00Z",
  completedAt: null,
  status: "running",
  prCount: 0,
  reviewCount: 0,
  commentCount: 0,
  errorMessage: null,
};

describe("POST /api/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when no PAT configured", async () => {
    vi.mocked(getSetting).mockReturnValue(null);

    const res = await POST(createPostRequest());
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/PAT/i);
  });

  it("returns 400 when no repository configured", async () => {
    vi.mocked(getSetting).mockImplementation((key: string) => {
      if (key === "github_pat") return "ghp_token";
      return null;
    });

    const res = await POST(createPostRequest());
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/repository/i);
  });

  it("returns 409 when sync already running", async () => {
    setupValidSettings();
    vi.mocked(getActiveSyncRun).mockReturnValue({
      ...mockSyncRun,
      id: 1,
      status: "running",
    });

    const res = await POST(createPostRequest());
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toMatch(/already/i);
  });

  it("starts sync and returns syncRunId on success", async () => {
    setupValidSettings();
    vi.mocked(getActiveSyncRun).mockReturnValue(null);
    vi.mocked(getLatestSuccessfulSyncRun).mockReturnValue(null);
    vi.mocked(createSyncRun).mockReturnValue(mockSyncRun);
    vi.mocked(syncPullRequests).mockResolvedValue(10);

    const res = await POST(createPostRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.syncRunId).toBe(42);
    expect(syncPullRequests).toHaveBeenCalledWith("owner", "repo", "ghp_token", 42, undefined);
  });

  // US-014: Incremental sync tests
  it("passes completedAt as since when previous successful sync exists", async () => {
    setupValidSettings();
    vi.mocked(getActiveSyncRun).mockReturnValue(null);
    vi.mocked(getLatestSuccessfulSyncRun).mockReturnValue({
      ...mockSyncRun,
      id: 10,
      status: "success",
      completedAt: "2024-06-01T10:05:00Z",
    });
    vi.mocked(createSyncRun).mockReturnValue(mockSyncRun);
    vi.mocked(syncPullRequests).mockResolvedValue(5);

    const res = await POST(createPostRequest());
    await res.json();

    expect(res.status).toBe(200);
    expect(syncPullRequests).toHaveBeenCalledWith(
      "owner",
      "repo",
      "ghp_token",
      42,
      "2024-06-01T10:05:00Z",
    );
  });

  it("does full sync when no previous successful sync exists", async () => {
    setupValidSettings();
    vi.mocked(getActiveSyncRun).mockReturnValue(null);
    vi.mocked(getLatestSuccessfulSyncRun).mockReturnValue(null);
    vi.mocked(createSyncRun).mockReturnValue(mockSyncRun);
    vi.mocked(syncPullRequests).mockResolvedValue(10);

    await POST(createPostRequest());

    expect(syncPullRequests).toHaveBeenCalledWith("owner", "repo", "ghp_token", 42, undefined);
  });

  // US-025: sinceDate from request body
  it("uses sinceDate from request body when provided", async () => {
    setupValidSettings();
    vi.mocked(getActiveSyncRun).mockReturnValue(null);
    vi.mocked(createSyncRun).mockReturnValue(mockSyncRun);
    vi.mocked(syncPullRequests).mockResolvedValue(10);

    const res = await POST(
      createPostRequest({ sinceDate: "2025-10-01T00:00:00Z" }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(syncPullRequests).toHaveBeenCalledWith(
      "owner",
      "repo",
      "ghp_token",
      42,
      "2025-10-01T00:00:00Z",
    );
  });

  it("sinceDate overrides incremental sync", async () => {
    setupValidSettings();
    vi.mocked(getActiveSyncRun).mockReturnValue(null);
    vi.mocked(getLatestSuccessfulSyncRun).mockReturnValue({
      ...mockSyncRun,
      id: 10,
      status: "success",
      completedAt: "2024-06-01T10:05:00Z",
    });
    vi.mocked(createSyncRun).mockReturnValue(mockSyncRun);
    vi.mocked(syncPullRequests).mockResolvedValue(10);

    await POST(createPostRequest({ sinceDate: "2025-10-01T00:00:00Z" }));

    // Should use sinceDate from body, NOT completedAt from last successful sync
    expect(syncPullRequests).toHaveBeenCalledWith(
      "owner",
      "repo",
      "ghp_token",
      42,
      "2025-10-01T00:00:00Z",
    );
  });
});

describe("GET /api/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null and empty history when no repository configured", async () => {
    vi.mocked(getSetting).mockReturnValue(null);

    const res = await GET();
    const data = await res.json();

    expect(data.syncRun).toBeNull();
    expect(data.history).toEqual([]);
  });

  it("returns latest sync run and history", async () => {
    vi.mocked(getSetting).mockImplementation((key: string) => {
      if (key === "github_owner") return "owner";
      if (key === "github_repo") return "repo";
      return null;
    });
    const mockRun = {
      ...mockSyncRun,
      id: 1,
      completedAt: "2024-06-01T10:05:00Z",
      status: "success",
      prCount: 42,
    };
    vi.mocked(getLatestSyncRun).mockReturnValue(mockRun);
    vi.mocked(getSyncRunHistory).mockReturnValue([mockRun]);

    const res = await GET();
    const data = await res.json();

    expect(data.syncRun.status).toBe("success");
    expect(data.syncRun.prCount).toBe(42);
    expect(data.history).toHaveLength(1);
    expect(data.history[0].id).toBe(1);
  });

  it("returns null syncRun and empty history when no sync runs exist", async () => {
    vi.mocked(getSetting).mockImplementation((key: string) => {
      if (key === "github_owner") return "owner";
      if (key === "github_repo") return "repo";
      return null;
    });
    vi.mocked(getLatestSyncRun).mockReturnValue(null);
    vi.mocked(getSyncRunHistory).mockReturnValue([]);

    const res = await GET();
    const data = await res.json();

    expect(data.syncRun).toBeNull();
    expect(data.history).toEqual([]);
  });
});
