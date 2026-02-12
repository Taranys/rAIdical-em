// US-007: Team API route unit tests
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetByUsername = vi.fn();

vi.mock("@/db/team-members");
vi.mock("@/db/settings");
vi.mock("octokit", () => ({
  Octokit: class MockOctokit {
    rest = { users: { getByUsername: mockGetByUsername } };
  },
}));

import { GET, POST } from "./route";
import * as teamMembersDAL from "@/db/team-members";
import * as settingsDAL from "@/db/settings";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/team", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/team", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all team members", async () => {
    vi.mocked(teamMembersDAL.getAllTeamMembers).mockReturnValue([
      {
        id: 1,
        githubUsername: "octocat",
        displayName: "The Octocat",
        avatarUrl: "https://avatars.githubusercontent.com/u/583231",
        isActive: 1,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.members).toHaveLength(1);
    expect(data.members[0].githubUsername).toBe("octocat");
  });

  it("returns empty array when no members", async () => {
    vi.mocked(teamMembersDAL.getAllTeamMembers).mockReturnValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.members).toEqual([]);
  });
});

describe("POST /api/team", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when username is missing", async () => {
    const response = await POST(makeRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/username/i);
  });

  it("returns 400 when username is empty string", async () => {
    const response = await POST(makeRequest({ username: "  " }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/username/i);
  });

  it("returns 400 when no PAT configured", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue(null);

    const response = await POST(makeRequest({ username: "octocat" }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/PAT/i);
  });

  it("returns 409 when username already exists", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue("ghp_test");
    vi.mocked(teamMembersDAL.getTeamMemberByUsername).mockReturnValue({
      id: 1,
      githubUsername: "octocat",
      displayName: "Octo",
      avatarUrl: null,
      isActive: 1,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    const response = await POST(makeRequest({ username: "octocat" }));
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toMatch(/already/i);
  });

  it("returns 404 when GitHub user not found", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue("ghp_test");
    vi.mocked(teamMembersDAL.getTeamMemberByUsername).mockReturnValue(null);

    const notFoundError = Object.assign(new Error("Not Found"), {
      status: 404,
    });
    mockGetByUsername.mockRejectedValue(notFoundError);

    const response = await POST(makeRequest({ username: "nonexistent" }));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toMatch(/not found/i);
  });

  it("creates team member on success", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue("ghp_test");
    vi.mocked(teamMembersDAL.getTeamMemberByUsername).mockReturnValue(null);

    mockGetByUsername.mockResolvedValue({
      data: {
        login: "octocat",
        name: "The Octocat",
        avatar_url: "https://avatars.githubusercontent.com/u/583231",
      },
    });

    vi.mocked(teamMembersDAL.createTeamMember).mockReturnValue({
      id: 1,
      githubUsername: "octocat",
      displayName: "The Octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231",
      isActive: 1,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    const response = await POST(makeRequest({ username: "octocat" }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.member.githubUsername).toBe("octocat");
    expect(data.member.displayName).toBe("The Octocat");
    expect(teamMembersDAL.createTeamMember).toHaveBeenCalledWith({
      githubUsername: "octocat",
      displayName: "The Octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231",
    });
  });

  it("uses login as display name when name is null", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue("ghp_test");
    vi.mocked(teamMembersDAL.getTeamMemberByUsername).mockReturnValue(null);

    mockGetByUsername.mockResolvedValue({
      data: {
        login: "octocat",
        name: null,
        avatar_url: "https://avatars.githubusercontent.com/u/583231",
      },
    });

    vi.mocked(teamMembersDAL.createTeamMember).mockReturnValue({
      id: 1,
      githubUsername: "octocat",
      displayName: "octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231",
      isActive: 1,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    const response = await POST(makeRequest({ username: "octocat" }));
    const data = await response.json();

    expect(data.member.displayName).toBe("octocat");
    expect(teamMembersDAL.createTeamMember).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: "octocat" }),
    );
  });

  it("trims whitespace from username", async () => {
    vi.mocked(settingsDAL.getSetting).mockReturnValue("ghp_test");
    vi.mocked(teamMembersDAL.getTeamMemberByUsername).mockReturnValue(null);

    mockGetByUsername.mockResolvedValue({
      data: {
        login: "octocat",
        name: "Octo",
        avatar_url: "https://avatars.githubusercontent.com/u/583231",
      },
    });

    vi.mocked(teamMembersDAL.createTeamMember).mockReturnValue({
      id: 1,
      githubUsername: "octocat",
      displayName: "Octo",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231",
      isActive: 1,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    await POST(makeRequest({ username: "  octocat  " }));

    expect(teamMembersDAL.getTeamMemberByUsername).toHaveBeenCalledWith(
      "octocat",
    );
  });
});
