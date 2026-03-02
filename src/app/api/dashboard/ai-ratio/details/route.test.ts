// Tests for AI ratio details API route
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/db/pull-requests", () => ({
  getPRDetailsByAuthor: vi.fn(() => [
    { number: 102, title: "AI fix", aiGenerated: "ai", classificationReason: "All 2/2 commits have Co-Authored-By matching AI patterns", createdAt: "2026-02-10T10:00:00Z", state: "merged" },
    { number: 101, title: "Human fix", aiGenerated: "human", classificationReason: "No AI co-author found in 3 commits", createdAt: "2026-02-05T10:00:00Z", state: "merged" },
  ]),
}));

function createRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/api/dashboard/ai-ratio/details");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString()) as Parameters<typeof GET>[0];
}

describe("GET /api/dashboard/ai-ratio/details", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when author is missing", async () => {
    const res = await GET(
      createRequest({ startDate: "2026-02-01", endDate: "2026-03-01" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when startDate is missing", async () => {
    const res = await GET(
      createRequest({ author: "alice", endDate: "2026-03-01" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when endDate is missing", async () => {
    const res = await GET(
      createRequest({ author: "alice", startDate: "2026-02-01" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns PR list with classification details", async () => {
    const res = await GET(
      createRequest({
        author: "alice",
        startDate: "2026-02-01T00:00:00Z",
        endDate: "2026-03-01T00:00:00Z",
      }),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.prs).toHaveLength(2);
    expect(json.prs[0]).toEqual({
      number: 102,
      title: "AI fix",
      aiGenerated: "ai",
      classificationReason: "All 2/2 commits have Co-Authored-By matching AI patterns",
      createdAt: "2026-02-10T10:00:00Z",
      state: "merged",
    });
  });
});
