// US-010: Sync API route unit tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/settings", () => ({
  getSetting: vi.fn(),
}));

vi.mock("@/db/sync-runs", () => ({
  createSyncRun: vi.fn(),
  getLatestSyncRun: vi.fn(),
  getActiveSyncRun: vi.fn(),
}));

vi.mock("@/lib/github-sync", () => ({
  syncPullRequests: vi.fn(),
}));

import { GET, POST } from "./route";
import { getSetting } from "@/db/settings";
import {
  createSyncRun,
  getLatestSyncRun,
  getActiveSyncRun,
} from "@/db/sync-runs";
import { syncPullRequests } from "@/lib/github-sync";

describe("POST /api/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when no PAT configured", async () => {
    vi.mocked(getSetting).mockReturnValue(null);

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/PAT/i);
  });

  it("returns 400 when no repository configured", async () => {
    vi.mocked(getSetting).mockImplementation((key: string) => {
      if (key === "github_pat") return "ghp_token";
      return null;
    });

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/repository/i);
  });

  it("returns 409 when sync already running", async () => {
    vi.mocked(getSetting).mockImplementation((key: string) => {
      if (key === "github_pat") return "ghp_token";
      if (key === "github_owner") return "owner";
      if (key === "github_repo") return "repo";
      return null;
    });
    vi.mocked(getActiveSyncRun).mockReturnValue({
      id: 1,
      repository: "owner/repo",
      startedAt: "2024-06-01T10:00:00Z",
      completedAt: null,
      status: "running",
      prCount: 0,
      commentCount: 0,
      errorMessage: null,
    });

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toMatch(/already/i);
  });

  it("starts sync and returns syncRunId on success", async () => {
    vi.mocked(getSetting).mockImplementation((key: string) => {
      if (key === "github_pat") return "ghp_token";
      if (key === "github_owner") return "owner";
      if (key === "github_repo") return "repo";
      return null;
    });
    vi.mocked(getActiveSyncRun).mockReturnValue(null);
    vi.mocked(createSyncRun).mockReturnValue({
      id: 42,
      repository: "owner/repo",
      startedAt: "2024-06-01T10:00:00Z",
      completedAt: null,
      status: "running",
      prCount: 0,
      commentCount: 0,
      errorMessage: null,
    });
    vi.mocked(syncPullRequests).mockResolvedValue(10);

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.syncRunId).toBe(42);
    expect(syncPullRequests).toHaveBeenCalledWith("owner", "repo", "ghp_token", 42);
  });
});

describe("GET /api/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no repository configured", async () => {
    vi.mocked(getSetting).mockReturnValue(null);

    const res = await GET();
    const data = await res.json();

    expect(data.syncRun).toBeNull();
  });

  it("returns latest sync run", async () => {
    vi.mocked(getSetting).mockImplementation((key: string) => {
      if (key === "github_owner") return "owner";
      if (key === "github_repo") return "repo";
      return null;
    });
    vi.mocked(getLatestSyncRun).mockReturnValue({
      id: 1,
      repository: "owner/repo",
      startedAt: "2024-06-01T10:00:00Z",
      completedAt: "2024-06-01T10:05:00Z",
      status: "success",
      prCount: 42,
      commentCount: 0,
      errorMessage: null,
    });

    const res = await GET();
    const data = await res.json();

    expect(data.syncRun.status).toBe("success");
    expect(data.syncRun.prCount).toBe(42);
  });

  it("returns null when no sync runs exist", async () => {
    vi.mocked(getSetting).mockImplementation((key: string) => {
      if (key === "github_owner") return "owner";
      if (key === "github_repo") return "repo";
      return null;
    });
    vi.mocked(getLatestSyncRun).mockReturnValue(null);

    const res = await GET();
    const data = await res.json();

    expect(data.syncRun).toBeNull();
  });
});
