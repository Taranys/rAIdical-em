// US-006: Unit tests for GitHub repository CRUD API
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "./route";

vi.mock("@/db/settings", () => ({
  getSetting: vi.fn(),
  setSetting: vi.fn(),
  deleteSetting: vi.fn(),
}));

import { getSetting, setSetting, deleteSetting } from "@/db/settings";

const mockGetSetting = vi.mocked(getSetting);
const mockSetSetting = vi.mocked(setSetting);
const mockDeleteSetting = vi.mocked(deleteSetting);

describe("GET /api/settings/github-repo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns configured: false when no settings exist", async () => {
    mockGetSetting.mockReturnValue(null);

    const res = await GET();
    const data = await res.json();

    expect(data).toEqual({ configured: false, owner: null, repo: null });
  });

  it("returns configured: true with owner and repo when set", async () => {
    mockGetSetting.mockImplementation((key: string) => {
      if (key === "github_owner") return "my-org";
      if (key === "github_repo") return "my-repo";
      return null;
    });

    const res = await GET();
    const data = await res.json();

    expect(data).toEqual({
      configured: true,
      owner: "my-org",
      repo: "my-repo",
    });
  });

  it("returns configured: false when only owner is set", async () => {
    mockGetSetting.mockImplementation((key: string) => {
      if (key === "github_owner") return "my-org";
      return null;
    });

    const res = await GET();
    const data = await res.json();

    expect(data).toEqual({ configured: false, owner: "my-org", repo: null });
  });
});

describe("PUT /api/settings/github-repo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves owner and repo and returns success", async () => {
    const request = new Request("http://localhost/api/settings/github-repo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: "my-org", repo: "my-repo" }),
    });

    const res = await PUT(request);
    const data = await res.json();

    expect(data).toEqual({ success: true });
    expect(mockSetSetting).toHaveBeenCalledWith("github_owner", "my-org");
    expect(mockSetSetting).toHaveBeenCalledWith("github_repo", "my-repo");
  });

  it("returns 400 when owner is missing", async () => {
    const request = new Request("http://localhost/api/settings/github-repo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo: "my-repo" }),
    });

    const res = await PUT(request);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Owner is required");
  });

  it("returns 400 when repo is missing", async () => {
    const request = new Request("http://localhost/api/settings/github-repo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: "my-org" }),
    });

    const res = await PUT(request);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Repository is required");
  });

  it("trims whitespace from owner and repo", async () => {
    const request = new Request("http://localhost/api/settings/github-repo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: "  my-org  ", repo: "  my-repo  " }),
    });

    await PUT(request);

    expect(mockSetSetting).toHaveBeenCalledWith("github_owner", "my-org");
    expect(mockSetSetting).toHaveBeenCalledWith("github_repo", "my-repo");
  });
});

describe("DELETE /api/settings/github-repo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes both owner and repo settings", async () => {
    const res = await DELETE();
    const data = await res.json();

    expect(data).toEqual({ success: true });
    expect(mockDeleteSetting).toHaveBeenCalledWith("github_owner");
    expect(mockDeleteSetting).toHaveBeenCalledWith("github_repo");
  });
});
