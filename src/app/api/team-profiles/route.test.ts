// US-2.11: Unit tests for team-profiles API route
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/db/team-members", () => ({
  getAllTeamMembers: vi.fn(),
}));

vi.mock("@/db/seniority-profiles", () => ({
  getProfilesByTeamMember: vi.fn(),
}));

// Prevent real DB connection
vi.mock("@/db", () => ({
  db: {},
  sqlite: {},
}));

import { getAllTeamMembers } from "@/db/team-members";
import { getProfilesByTeamMember } from "@/db/seniority-profiles";

const mockGetAllTeamMembers = vi.mocked(getAllTeamMembers);
const mockGetProfilesByTeamMember = vi.mocked(getProfilesByTeamMember);

describe("GET /api/team-profiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no team members", async () => {
    mockGetAllTeamMembers.mockReturnValue([]);

    const response = await GET();
    const data = await response.json();

    expect(data.members).toEqual([]);
  });

  it("returns members with their seniority profiles", async () => {
    mockGetAllTeamMembers.mockReturnValue([
      {
        id: 1,
        githubUsername: "alice",
        displayName: "Alice",
        avatarUrl: "https://example.com/alice.png",
        color: "#E25A3B",
        isActive: 1,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: 2,
        githubUsername: "bob",
        displayName: "Bob",
        avatarUrl: null,
        color: "#2A9D8F",
        isActive: 1,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ]);

    mockGetProfilesByTeamMember.mockImplementation((memberId) => {
      if (memberId === 1) {
        return [
          {
            id: 1,
            teamMemberId: 1,
            dimensionName: "security",
            dimensionFamily: "technical",
            maturityLevel: "senior",
            lastComputedAt: "2024-06-01T00:00:00Z",
            supportingMetrics: "{}",
          },
          {
            id: 2,
            teamMemberId: 1,
            dimensionName: "pedagogy",
            dimensionFamily: "soft_skill",
            maturityLevel: "experienced",
            lastComputedAt: "2024-06-01T00:00:00Z",
            supportingMetrics: "{}",
          },
        ];
      }
      return [];
    });

    const response = await GET();
    const data = await response.json();

    expect(data.members).toHaveLength(2);

    // Alice has profiles
    expect(data.members[0].id).toBe(1);
    expect(data.members[0].displayName).toBe("Alice");
    expect(data.members[0].profiles).toHaveLength(2);
    expect(data.members[0].profiles[0]).toEqual({
      dimensionName: "security",
      dimensionFamily: "technical",
      maturityLevel: "senior",
      lastComputedAt: "2024-06-01T00:00:00Z",
      supportingMetrics: {},
    });

    // Bob has no profiles
    expect(data.members[1].id).toBe(2);
    expect(data.members[1].profiles).toEqual([]);
  });

  it("includes parsed supportingMetrics with rationale in the response", async () => {
    mockGetAllTeamMembers.mockReturnValue([
      {
        id: 1,
        githubUsername: "alice",
        displayName: "Alice",
        avatarUrl: null,
        color: "#E25A3B",
        isActive: 1,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ]);

    mockGetProfilesByTeamMember.mockReturnValue([
      {
        id: 1,
        teamMemberId: 1,
        dimensionName: "security",
        dimensionFamily: "technical",
        maturityLevel: "senior",
        lastComputedAt: "2024-06-01T00:00:00Z",
        supportingMetrics: '{"depthScore":78,"volume":15,"highValueRatio":0.45,"rationale":"depth score 78/100 (≥70), 15 comments (≥10), 45% high-value ratio (≥40%) — all senior thresholds met"}',
      },
    ]);

    const response = await GET();
    const data = await response.json();

    const profile = data.members[0].profiles[0];
    expect(profile.supportingMetrics).toBeDefined();
    expect(profile.supportingMetrics.rationale).toBe(
      "depth score 78/100 (≥70), 15 comments (≥10), 45% high-value ratio (≥40%) — all senior thresholds met",
    );
    expect(profile.supportingMetrics.depthScore).toBe(78);
  });

  it("returns null supportingMetrics when database value is null", async () => {
    mockGetAllTeamMembers.mockReturnValue([
      {
        id: 1,
        githubUsername: "alice",
        displayName: "Alice",
        avatarUrl: null,
        color: "#E25A3B",
        isActive: 1,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ]);

    mockGetProfilesByTeamMember.mockReturnValue([
      {
        id: 1,
        teamMemberId: 1,
        dimensionName: "security",
        dimensionFamily: "technical",
        maturityLevel: "senior",
        lastComputedAt: "2024-06-01T00:00:00Z",
        supportingMetrics: null,
      },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(data.members[0].profiles[0].supportingMetrics).toBeNull();
  });
});
