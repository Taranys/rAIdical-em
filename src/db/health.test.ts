import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockExec, mockPrepare, mockValues, mockRun, mockInsert } = vi.hoisted(
  () => {
    const mockRun = vi.fn();
    const mockValues = vi.fn().mockReturnValue({ run: mockRun });
    const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
    return {
      mockExec: vi.fn(),
      mockPrepare: vi.fn(),
      mockValues,
      mockRun,
      mockInsert,
    };
  }
);

vi.mock("./index", () => ({
  sqlite: {
    exec: mockExec,
    prepare: mockPrepare,
  },
  db: {
    insert: mockInsert,
  },
}));

import { checkDbHealth } from "./health";

describe("checkDbHealth", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockInsert.mockReturnValue({ values: mockValues });
    mockValues.mockReturnValue({ run: mockRun });
  });

  it("returns healthy status when database is accessible", () => {
    mockPrepare
      .mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ version: "3.45.0" }),
      })
      .mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ count: 3 }),
      });

    const result = checkDbHealth();

    expect(result.connected).toBe(true);
    expect(result.sqliteVersion).toBe("3.45.0");
    expect(result.tableCount).toBe(3);
    expect(result.dbPath).toBe("data/em-control-tower.db");
    expect(result.error).toBeUndefined();
  });

  it("returns unhealthy status when database throws", () => {
    mockExec.mockImplementation(() => {
      throw new Error("SQLITE_CANTOPEN");
    });

    const result = checkDbHealth();

    expect(result.connected).toBe(false);
    expect(result.sqliteVersion).toBeNull();
    expect(result.tableCount).toBe(0);
    expect(result.error).toBe("SQLITE_CANTOPEN");
  });

  it("creates health_check table if not exists", () => {
    mockPrepare
      .mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ version: "3.45.0" }),
      })
      .mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ count: 1 }),
      });

    checkDbHealth();

    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining("CREATE TABLE IF NOT EXISTS health_check")
    );
  });

  it("inserts a health check record on success", () => {
    mockPrepare
      .mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ version: "3.45.0" }),
      })
      .mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ count: 1 }),
      });

    checkDbHealth();

    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ok",
      })
    );
  });
});
