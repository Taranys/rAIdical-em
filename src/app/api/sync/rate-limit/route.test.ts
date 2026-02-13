// US-010: Rate limit API route unit tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/settings", () => ({
  getSetting: vi.fn(),
}));

vi.mock("@/lib/github-sync", () => ({
  fetchRateLimit: vi.fn(),
}));

import { GET } from "./route";
import { getSetting } from "@/db/settings";
import { fetchRateLimit } from "@/lib/github-sync";

describe("GET /api/sync/rate-limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when no PAT configured", async () => {
    vi.mocked(getSetting).mockReturnValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/PAT/i);
  });

  it("returns rate limit data on success", async () => {
    vi.mocked(getSetting).mockReturnValue("ghp_token");
    vi.mocked(fetchRateLimit).mockResolvedValue({
      limit: 5000,
      remaining: 4500,
      resetAt: "2024-06-01T11:00:00.000Z",
    });

    const res = await GET();
    const data = await res.json();

    expect(data.rateLimit).toEqual({
      limit: 5000,
      remaining: 4500,
      resetAt: "2024-06-01T11:00:00.000Z",
    });
  });

  it("returns 500 on API failure", async () => {
    vi.mocked(getSetting).mockReturnValue("ghp_token");
    vi.mocked(fetchRateLimit).mockRejectedValue(new Error("Network error"));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toMatch(/Network error/);
  });
});
