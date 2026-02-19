// US-008: Delete team member API route unit tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/team-members");

import { DELETE } from "./route";
import * as teamMembersDAL from "@/db/team-members";

function makeRequest(id: string) {
  return new Request(`http://localhost/api/team/${id}`, {
    method: "DELETE",
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("DELETE /api/team/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for non-numeric id", async () => {
    const response = await DELETE(makeRequest("abc"), makeParams("abc"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/invalid/i);
  });

  it("returns 400 for negative id", async () => {
    const response = await DELETE(makeRequest("-1"), makeParams("-1"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/invalid/i);
  });

  it("returns 400 for zero id", async () => {
    const response = await DELETE(makeRequest("0"), makeParams("0"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/invalid/i);
  });

  it("returns 404 when member not found", async () => {
    vi.mocked(teamMembersDAL.deactivateTeamMember).mockReturnValue(null);

    const response = await DELETE(makeRequest("999"), makeParams("999"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toMatch(/not found/i);
  });

  it("returns 200 on successful deactivation", async () => {
    vi.mocked(teamMembersDAL.deactivateTeamMember).mockReturnValue({
      id: 1,
      githubUsername: "octocat",
      displayName: "The Octocat",
      avatarUrl: null,
      color: "#E25A3B",
      isActive: 0,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    });

    const response = await DELETE(makeRequest("1"), makeParams("1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toMatch(/removed/i);
    expect(teamMembersDAL.deactivateTeamMember).toHaveBeenCalledWith(1);
  });
});
