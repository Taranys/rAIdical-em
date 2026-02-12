// US-006: Unit tests for GitHub owners prefetch API
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/db/settings", () => ({
  getSetting: vi.fn(),
}));

import { getSetting } from "@/db/settings";

const mockGetSetting = vi.mocked(getSetting);

const mockGetAuthenticated = vi.fn();
const mockListOrgs = vi.fn();

vi.mock("octokit", () => ({
  Octokit: class {
    rest = {
      users: { getAuthenticated: mockGetAuthenticated },
      orgs: { listForAuthenticatedUser: mockListOrgs },
    };
  },
}));

describe("GET /api/settings/github-owners", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when no PAT is configured", async () => {
    mockGetSetting.mockReturnValue(null);

    const res = await GET();
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("No PAT configured");
  });

  it("returns authenticated user and their organizations", async () => {
    mockGetSetting.mockReturnValue("ghp_token123");

    mockGetAuthenticated.mockResolvedValue({
      data: { login: "octocat" },
    });
    mockListOrgs.mockResolvedValue({
      data: [{ login: "my-org" }, { login: "another-org" }],
    });

    const res = await GET();
    const data = await res.json();

    expect(data.owners).toEqual([
      { login: "octocat", type: "user" },
      { login: "my-org", type: "org" },
      { login: "another-org", type: "org" },
    ]);
  });

  it("returns only user when no organizations", async () => {
    mockGetSetting.mockReturnValue("ghp_token123");

    mockGetAuthenticated.mockResolvedValue({
      data: { login: "octocat" },
    });
    mockListOrgs.mockResolvedValue({ data: [] });

    const res = await GET();
    const data = await res.json();

    expect(data.owners).toEqual([{ login: "octocat", type: "user" }]);
  });

  it("returns only user when orgs fetch fails", async () => {
    mockGetSetting.mockReturnValue("ghp_token123");

    mockGetAuthenticated.mockResolvedValue({
      data: { login: "octocat" },
    });
    mockListOrgs.mockRejectedValue(new Error("Resource not accessible"));

    const res = await GET();
    const data = await res.json();

    expect(data.owners).toEqual([{ login: "octocat", type: "user" }]);
  });

  it("returns 500 when user fetch fails", async () => {
    mockGetSetting.mockReturnValue("ghp_token123");

    mockGetAuthenticated.mockRejectedValue(new Error("Bad credentials"));

    const res = await GET();
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Bad credentials");
  });
});
