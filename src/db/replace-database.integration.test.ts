// US-2.17: Integration test for replaceDatabase().
import { describe, it, expect, afterAll } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { db, replaceDatabase, DB_PATH } from "./index";
import { getAllTeamMembers } from "./team-members";

const migrationsFolder = path.join(process.cwd(), "drizzle");

/**
 * Creates a seeded test database using Drizzle migrations (same as the app)
 * so the schema always matches, regardless of which migrations exist.
 */
function createSeededDatabase(filePath: string, members: string[]) {
  const raw = new Database(filePath);
  raw.pragma("journal_mode = DELETE");

  // Apply the same Drizzle migrations the app uses at startup
  const tempDb = drizzle(raw, { schema });
  migrate(tempDb, { migrationsFolder });

  const now = new Date().toISOString();
  const insert = raw.prepare("INSERT INTO team_members (github_username, display_name, is_active, created_at, updated_at) VALUES (?, ?, 1, ?, ?)");
  for (const name of members) {
    insert.run(name, name, now, now);
  }
  raw.close();
}

describe("replaceDatabase integration", () => {
  const tempFiles: string[] = [];
  const backupPath = DB_PATH + ".test-backup";

  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, backupPath);
  }
  for (const suffix of ["-wal", "-shm"]) {
    if (fs.existsSync(DB_PATH + suffix)) {
      fs.copyFileSync(DB_PATH + suffix, backupPath + suffix);
    }
  }

  afterAll(() => {
    if (fs.existsSync(backupPath)) {
      replaceDatabase(backupPath);
      fs.unlinkSync(backupPath);
    }
    for (const suffix of ["-wal", "-shm"]) {
      try { fs.unlinkSync(backupPath + suffix); } catch { /* */ }
    }
    for (const f of tempFiles) {
      try { fs.unlinkSync(f); } catch { /* */ }
    }
  });

  it("data is accessible via DAL and db proxy after replaceDatabase()", () => {
    const tempFile = path.join(os.tmpdir(), `raidical-int-${Date.now()}.db`);
    tempFiles.push(tempFile);
    createSeededDatabase(tempFile, ["alice", "bob", "charlie"]);

    replaceDatabase(tempFile);

    // Verify via DAL (uses default db parameter = proxy)
    const members = getAllTeamMembers();
    expect(members).toHaveLength(3);
    expect(members.map((m) => m.githubUsername).sort()).toEqual(["alice", "bob", "charlie"]);

    // Verify via db proxy directly
    const rows = db.select().from(schema.teamMembers).all();
    expect(rows).toHaveLength(3);
  });
});
