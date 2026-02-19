// US-2.17: Unit tests for database import API
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db", () => ({
  db: {},
  sqlite: { close: vi.fn() },
  DB_PATH: "/fake/path/em-control-tower.db",
  replaceDatabase: vi.fn(),
}));

const mockWriteFileSync = vi.fn();
const mockUnlinkSync = vi.fn();

vi.mock("node:fs", () => ({
  default: {
    writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
    unlinkSync: (...args: unknown[]) => mockUnlinkSync(...args),
    existsSync: () => false,
    mkdirSync: vi.fn(),
  },
}));

vi.mock("node:os", () => ({
  default: { tmpdir: () => "/tmp" },
}));

let mockDbInstance: {
  prepare: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
};

vi.mock("better-sqlite3", () => {
  return {
    default: function MockDatabase() {
      return mockDbInstance;
    },
  };
});

import { POST } from "./route";
import { replaceDatabase } from "@/db";

const mockReplaceDatabase = vi.mocked(replaceDatabase);

// SQLite file magic bytes: "SQLite format 3\0"
const SQLITE_MAGIC = Buffer.from("SQLite format 3\0");

function makeValidSqliteBuffer(): Buffer {
  const buf = Buffer.alloc(4096);
  SQLITE_MAGIC.copy(buf);
  return buf;
}

function makeFormData(file: File): FormData {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
}

function makeRequest(formData: FormData): Request {
  return new Request("http://localhost/api/settings/database/import", {
    method: "POST",
    body: formData,
  });
}

function setupMockDb(tables: string[], countPerTable = 5) {
  const mockStmt = {
    all: vi.fn().mockReturnValue(tables.map((name) => ({ name }))),
  };
  const mockCountStmt = {
    get: vi.fn().mockReturnValue({ count: countPerTable }),
  };
  mockDbInstance = {
    prepare: vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("sqlite_master")) return mockStmt;
      return mockCountStmt;
    }),
    close: vi.fn(),
  };
}

const ALL_REQUIRED_TABLES = [
  "settings",
  "team_members",
  "pull_requests",
  "reviews",
  "review_comments",
  "pr_comments",
  "sync_runs",
];

describe("POST /api/settings/database/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockDb(ALL_REQUIRED_TABLES);
  });

  it("returns 400 when no file is provided", async () => {
    const formData = new FormData();
    const req = makeRequest(formData);

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain("file");
  });

  it("returns 400 when file is not a valid SQLite database", async () => {
    const invalidContent = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    const file = new File([invalidContent], "bad.db", {
      type: "application/octet-stream",
    });
    const req = makeRequest(makeFormData(file));

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain("SQLite");
  });

  it("returns 400 when required tables are missing", async () => {
    setupMockDb(["settings", "team_members"]);

    const file = new File([makeValidSqliteBuffer()], "incomplete.db", {
      type: "application/octet-stream",
    });
    const req = makeRequest(makeFormData(file));

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain("Missing required tables");
  });

  it("replaces database and returns table stats on success", async () => {
    const file = new File([makeValidSqliteBuffer()], "valid.db", {
      type: "application/octet-stream",
    });
    const req = makeRequest(makeFormData(file));

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.tables).toBeDefined();
    expect(mockReplaceDatabase).toHaveBeenCalledTimes(1);
  });

  it("cleans up temp file on validation failure", async () => {
    setupMockDb([]);

    const file = new File([makeValidSqliteBuffer()], "bad-schema.db", {
      type: "application/octet-stream",
    });
    const req = makeRequest(makeFormData(file));

    const res = await POST(req);
    expect(res.status).toBe(400);

    expect(mockDbInstance.close).toHaveBeenCalled();
    expect(mockUnlinkSync).toHaveBeenCalled();
  });
});
