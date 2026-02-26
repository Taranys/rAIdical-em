import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db", () => ({
  db: {},
  sqlite: { close: vi.fn() },
  DB_PATH: "/fake/path/rAIdical-em.db",
  resetDatabase: vi.fn(),
}));

import { POST } from "./route";
import { resetDatabase } from "@/db";

const mockResetDatabase = vi.mocked(resetDatabase);

describe("POST /api/settings/database/reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls resetDatabase and returns success", async () => {
    const res = await POST();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockResetDatabase).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when resetDatabase throws", async () => {
    mockResetDatabase.mockImplementationOnce(() => {
      throw new Error("disk full");
    });

    const res = await POST();
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain("disk full");
  });
});
