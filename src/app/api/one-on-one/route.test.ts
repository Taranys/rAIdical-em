// US-2.14: Unit tests for one-on-one preparation API route
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/db/team-members", () => ({
  getAllTeamMembers: vi.fn(),
}));

vi.mock("@/db/seniority-profiles", () => ({
  getProfilesByTeamMember: vi.fn(),
}));

vi.mock("@/db/highlights", () => ({
  getHighlightsByTeamMember: vi.fn(),
}));

vi.mock("@/db/comment-classifications", () => ({
  getCategoryDistributionByReviewer: vi.fn(),
}));

vi.mock("@/lib/review-depth-score", () => ({
  computeDepthScore: vi.fn(),
}));

// Prevent real DB connection — build a deep chainable mock
function createChainMock() {
  const chain: Record<string, unknown> = {};
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === "get") return () => null;
      if (prop === "all") return () => [];
      return () => new Proxy({}, handler);
    },
  };
  return new Proxy(chain, handler);
}

vi.mock("@/db", () => ({
  db: {
    select: () => createChainMock(),
  },
}));

vi.mock("@/db/schema", () => ({
  reviewComments: {},
  prComments: {},
  pullRequests: {},
  highlights: {},
}));

import { getAllTeamMembers } from "@/db/team-members";
import { getProfilesByTeamMember } from "@/db/seniority-profiles";
import { getHighlightsByTeamMember } from "@/db/highlights";
import { getCategoryDistributionByReviewer } from "@/db/comment-classifications";
import { computeDepthScore } from "@/lib/review-depth-score";

const mockGetAllTeamMembers = vi.mocked(getAllTeamMembers);
const mockGetProfilesByTeamMember = vi.mocked(getProfilesByTeamMember);
const mockGetHighlightsByTeamMember = vi.mocked(getHighlightsByTeamMember);
const mockGetCategoryDistribution = vi.mocked(getCategoryDistributionByReviewer);
const mockComputeDepthScore = vi.mocked(computeDepthScore);

const TEAM_MEMBERS = [
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
];

describe("GET /api/one-on-one", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllTeamMembers.mockReturnValue(TEAM_MEMBERS);
  });

  it("returns team members list when no memberId provided", async () => {
    const request = new Request("http://localhost/api/one-on-one");
    const response = await GET(request);
    const data = await response.json();

    expect(data.members).toHaveLength(2);
    expect(data.members[0].displayName).toBe("Alice");
    expect(data.members[1].displayName).toBe("Bob");
  });

  it("returns 400 for invalid memberId", async () => {
    const request = new Request("http://localhost/api/one-on-one?memberId=abc");
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid memberId");
  });

  it("returns 404 for unknown memberId", async () => {
    const request = new Request("http://localhost/api/one-on-one?memberId=999");
    const response = await GET(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Member not found");
  });

  it("returns member data with profiles and highlights", async () => {
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
        dimensionName: "pedagogy",
        dimensionFamily: "soft_skill",
        maturityLevel: "experienced",
        lastComputedAt: "2024-06-01T00:00:00Z",
        supportingMetrics: "{}",
      },
    ]);

    mockGetHighlightsByTeamMember.mockReturnValue([]);
    mockGetCategoryDistribution.mockReturnValue([]);
    mockComputeDepthScore.mockReturnValue(0);

    const request = new Request(
      "http://localhost/api/one-on-one?memberId=1&startDate=2024-01-01&endDate=2024-12-31",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.member.displayName).toBe("Alice");
    expect(data.profiles).toHaveLength(2);
    expect(data.profiles[0].dimensionName).toBe("security");
    expect(data.summary.overallMaturity).toBeTruthy();
    expect(data.summary.topDimensions).toHaveLength(2);
    expect(data.bestComments).toEqual([]);
    expect(data.growthOpportunities).toEqual([]);
  });

  it("computes depth score when date range provided", async () => {
    mockGetProfilesByTeamMember.mockReturnValue([]);
    mockGetHighlightsByTeamMember.mockReturnValue([]);
    mockGetCategoryDistribution.mockReturnValue([
      { reviewer: "alice", category: "security", count: 5 },
      { reviewer: "alice", category: "nitpick_style", count: 3 },
    ]);
    mockComputeDepthScore.mockReturnValue(72);

    const request = new Request(
      "http://localhost/api/one-on-one?memberId=1&startDate=2024-01-01&endDate=2024-12-31",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.summary.depthScore).toBe(72);
    expect(data.summary.totalComments).toBe(8);
    expect(data.summary.topCategories).toHaveLength(2);
    expect(mockComputeDepthScore).toHaveBeenCalledOnce();
  });

  it("does not leak supportingMetrics or internal IDs in profiles", async () => {
    mockGetProfilesByTeamMember.mockReturnValue([
      {
        id: 1,
        teamMemberId: 1,
        dimensionName: "security",
        dimensionFamily: "technical",
        maturityLevel: "senior",
        lastComputedAt: "2024-06-01T00:00:00Z",
        supportingMetrics: '{"some":"data"}',
      },
    ]);
    mockGetHighlightsByTeamMember.mockReturnValue([]);
    mockGetCategoryDistribution.mockReturnValue([]);
    mockComputeDepthScore.mockReturnValue(0);

    const request = new Request("http://localhost/api/one-on-one?memberId=1");
    const response = await GET(request);
    const data = await response.json();

    expect(data.profiles[0]).not.toHaveProperty("supportingMetrics");
    expect(data.profiles[0]).not.toHaveProperty("id");
    expect(data.profiles[0]).not.toHaveProperty("teamMemberId");
  });
});
