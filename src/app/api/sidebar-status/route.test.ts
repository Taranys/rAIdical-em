import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/settings");
vi.mock("@/db/team-members");
vi.mock("@/db/sync-runs");

import { GET } from "./route";
import * as settingsDAL from "@/db/settings";
import * as teamMembersDAL from "@/db/team-members";
import * as syncRunsDAL from "@/db/sync-runs";

describe("GET /api/sidebar-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all configured when everything is set up", async () => {
    vi.mocked(settingsDAL.hasSetting).mockImplementation(
      (key: string) => key === "github_pat" || key === "github_repo",
    );
    vi.mocked(settingsDAL.getSetting).mockImplementation((key: string) => {
      if (key === "github_owner") return "acme";
      if (key === "github_repo") return "app";
      return null;
    });
    vi.mocked(teamMembersDAL.getAllTeamMembers).mockReturnValue([
      { id: 1, githubUsername: "dev1", displayName: "Dev 1", avatarUrl: null, color: "#E25A3B", isActive: 1, createdAt: "", updatedAt: "" },
    ]);
    vi.mocked(syncRunsDAL.getLatestSyncRun).mockReturnValue({
      id: 1, repository: "acme/app", status: "success", prCount: 10, reviewCount: 5, commentCount: 3,
      startedAt: "2024-01-01T00:00:00Z", completedAt: "2024-01-01T00:05:00Z", errorMessage: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({
      settings: { configured: true },
      team: { configured: true },
      sync: { hasRun: true, status: "success" },
    });
  });

  it("returns all unconfigured when nothing is set up", async () => {
    vi.mocked(settingsDAL.hasSetting).mockReturnValue(false);
    vi.mocked(settingsDAL.getSetting).mockReturnValue(null);
    vi.mocked(teamMembersDAL.getAllTeamMembers).mockReturnValue([]);

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({
      settings: { configured: false },
      team: { configured: false },
      sync: { hasRun: false, status: null },
    });
  });

  it("returns settings not configured when PAT is set but repo is missing", async () => {
    vi.mocked(settingsDAL.hasSetting).mockImplementation(
      (key: string) => key === "github_pat",
    );
    vi.mocked(settingsDAL.getSetting).mockReturnValue(null);
    vi.mocked(teamMembersDAL.getAllTeamMembers).mockReturnValue([]);

    const response = await GET();
    const data = await response.json();

    expect(data.settings.configured).toBe(false);
  });

  it("returns sync status running when a sync is in progress", async () => {
    vi.mocked(settingsDAL.hasSetting).mockReturnValue(true);
    vi.mocked(settingsDAL.getSetting).mockImplementation((key: string) => {
      if (key === "github_owner") return "acme";
      if (key === "github_repo") return "app";
      return null;
    });
    vi.mocked(teamMembersDAL.getAllTeamMembers).mockReturnValue([]);
    vi.mocked(syncRunsDAL.getLatestSyncRun).mockReturnValue({
      id: 2, repository: "acme/app", status: "running", prCount: 0, reviewCount: 0, commentCount: 0,
      startedAt: "2024-01-01T00:00:00Z", completedAt: null, errorMessage: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(data.sync).toEqual({ hasRun: true, status: "running" });
  });

  it("returns sync error status when last sync failed", async () => {
    vi.mocked(settingsDAL.hasSetting).mockReturnValue(true);
    vi.mocked(settingsDAL.getSetting).mockImplementation((key: string) => {
      if (key === "github_owner") return "acme";
      if (key === "github_repo") return "app";
      return null;
    });
    vi.mocked(teamMembersDAL.getAllTeamMembers).mockReturnValue([]);
    vi.mocked(syncRunsDAL.getLatestSyncRun).mockReturnValue({
      id: 3, repository: "acme/app", status: "error", prCount: 0, reviewCount: 0, commentCount: 0,
      startedAt: "2024-01-01T00:00:00Z", completedAt: "2024-01-01T00:01:00Z", errorMessage: "Timeout",
    });

    const response = await GET();
    const data = await response.json();

    expect(data.sync).toEqual({ hasRun: true, status: "error" });
  });
});
