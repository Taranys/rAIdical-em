// US-2.11: Unit tests for team-profiles API route
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/db/team-members", () => ({
  getAllTeamMembers: vi.fn(),
}));

vi.mock("@/db/seniority-profiles", () => ({
  getProfilesByTeamMember: vi.fn(),
}));

vi.mock("@/db/seniority-dimension-configs", () => ({
  getEnabledDimensionConfigs: vi.fn().mockReturnValue([
    { id: 1, name: "security", family: "technical", label: "Security", description: "Security desc", sourceCategories: '["security"]', isEnabled: 1, sortOrder: 0, createdAt: "", updatedAt: "" },
    { id: 2, name: "architecture", family: "technical", label: "Architecture", description: "Architecture desc", sourceCategories: '["architecture_design"]', isEnabled: 1, sortOrder: 1, createdAt: "", updatedAt: "" },
    { id: 3, name: "performance", family: "technical", label: "Performance", description: "Performance desc", sourceCategories: '["performance"]', isEnabled: 1, sortOrder: 2, createdAt: "", updatedAt: "" },
    { id: 4, name: "testing", family: "technical", label: "Testing", description: "Testing desc", sourceCategories: '["missing_test_coverage"]', isEnabled: 1, sortOrder: 3, createdAt: "", updatedAt: "" },
    { id: 5, name: "pedagogy", family: "soft_skill", label: "Pedagogy", description: "Pedagogy desc", sourceCategories: null, isEnabled: 1, sortOrder: 4, createdAt: "", updatedAt: "" },
    { id: 6, name: "cross_team_awareness", family: "soft_skill", label: "Cross-team Awareness", description: "Cross-team desc", sourceCategories: null, isEnabled: 1, sortOrder: 5, createdAt: "", updatedAt: "" },
    { id: 7, name: "boldness", family: "soft_skill", label: "Boldness", description: "Boldness desc", sourceCategories: null, isEnabled: 1, sortOrder: 6, createdAt: "", updatedAt: "" },
    { id: 8, name: "thoroughness", family: "soft_skill", label: "Thoroughness", description: "Thoroughness desc", sourceCategories: null, isEnabled: 1, sortOrder: 7, createdAt: "", updatedAt: "" },
  ]),
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

  it("includes dimensionConfigs in the response", async () => {
    mockGetAllTeamMembers.mockReturnValue([]);

    const response = await GET();
    const data = await response.json();

    expect(data.dimensionConfigs).toBeDefined();
    expect(data.dimensionConfigs).toHaveLength(8);
    expect(data.dimensionConfigs[0]).toEqual(
      expect.objectContaining({ name: "security", family: "technical", label: "Security" }),
    );
  });

  it("filters out profiles for non-enabled dimensions", async () => {
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
        supportingMetrics: "{}",
      },
      {
        id: 2,
        teamMemberId: 1,
        dimensionName: "typescript",
        dimensionFamily: "technical",
        maturityLevel: "junior",
        lastComputedAt: "2024-06-01T00:00:00Z",
        supportingMetrics: "{}",
      },
    ]);

    const response = await GET();
    const data = await response.json();

    // "typescript" is not in enabled dimensions, should be filtered out
    expect(data.members[0].profiles).toHaveLength(1);
    expect(data.members[0].profiles[0].dimensionName).toBe("security");
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
