// US-005: Settings data access layer integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { getSetting, setSetting, deleteSetting, hasSetting } from "./settings";

describe("settings DAL (integration)", () => {
  let testSqlite: InstanceType<typeof Database>;
  let testDb: ReturnType<typeof drizzle>;

  beforeEach(() => {
    testSqlite = new Database(":memory:");
    testSqlite.pragma("journal_mode = WAL");
    testDb = drizzle(testSqlite, { schema });

    testSqlite.exec(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  });

  afterEach(() => {
    testSqlite.close();
  });

  it("returns null when no setting exists", () => {
    expect(getSetting("github_pat", testDb)).toBeNull();
  });

  it("stores and retrieves a PAT (encrypted in DB, decrypted on read)", () => {
    setSetting("github_pat", "ghp_test123", testDb);

    // Raw DB value should NOT be the plain text (it's encrypted)
    const raw = testSqlite
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get("github_pat") as { value: string } | undefined;
    expect(raw).toBeDefined();
    expect(raw!.value).not.toBe("ghp_test123");

    // getSetting should return the decrypted value
    expect(getSetting("github_pat", testDb)).toBe("ghp_test123");
  });

  it("deletes a setting", () => {
    setSetting("github_pat", "ghp_test123", testDb);
    deleteSetting("github_pat", testDb);
    expect(getSetting("github_pat", testDb)).toBeNull();
  });

  it("hasSetting returns false when missing, true when present", () => {
    expect(hasSetting("github_pat", testDb)).toBe(false);
    setSetting("github_pat", "ghp_test123", testDb);
    expect(hasSetting("github_pat", testDb)).toBe(true);
  });

  it("updates an existing setting", () => {
    setSetting("github_pat", "ghp_first", testDb);
    setSetting("github_pat", "ghp_second", testDb);
    expect(getSetting("github_pat", testDb)).toBe("ghp_second");

    // Only one row should exist
    const rows = testDb.select().from(schema.settings).all();
    expect(rows).toHaveLength(1);
  });

  it("sets updatedAt on insert and update", () => {
    const before = new Date().toISOString();
    setSetting("github_pat", "ghp_test", testDb);

    const rows = testDb.select().from(schema.settings).all();
    expect(rows[0].updatedAt >= before).toBe(true);
  });

  it("stores non-PAT keys as plain text", () => {
    setSetting("github_org", "my-org", testDb);

    const raw = testSqlite
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get("github_org") as { value: string } | undefined;
    expect(raw!.value).toBe("my-org");

    expect(getSetting("github_org", testDb)).toBe("my-org");
  });
});
