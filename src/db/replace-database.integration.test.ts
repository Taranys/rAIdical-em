// US-2.17: Integration test for replaceDatabase().
import { describe, it, expect, afterAll } from "vitest";
import Database from "better-sqlite3";
import * as schema from "./schema";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { db, replaceDatabase, DB_PATH } from "./index";
import { getAllTeamMembers } from "./team-members";

function createSeededDatabase(filePath: string, members: string[]) {
  const raw = new Database(filePath);
  raw.pragma("journal_mode = DELETE");
  raw.exec(`
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS team_members (id INTEGER PRIMARY KEY AUTOINCREMENT, github_username TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, avatar_url TEXT, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS pull_requests (id INTEGER PRIMARY KEY, github_id INTEGER NOT NULL UNIQUE, number INTEGER NOT NULL, title TEXT NOT NULL, author TEXT NOT NULL, state TEXT NOT NULL, created_at TEXT NOT NULL, merged_at TEXT, additions INTEGER NOT NULL DEFAULT 0, deletions INTEGER NOT NULL DEFAULT 0, changed_files INTEGER NOT NULL DEFAULT 0, ai_generated TEXT NOT NULL DEFAULT 'human', raw_json TEXT);
    CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY, github_id INTEGER NOT NULL UNIQUE, pull_request_id INTEGER NOT NULL, reviewer TEXT NOT NULL, state TEXT NOT NULL, submitted_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS review_comments (id INTEGER PRIMARY KEY, github_id INTEGER NOT NULL UNIQUE, pull_request_id INTEGER NOT NULL, reviewer TEXT NOT NULL, body TEXT NOT NULL, file_path TEXT, line INTEGER, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS pr_comments (id INTEGER PRIMARY KEY, github_id INTEGER NOT NULL UNIQUE, pull_request_id INTEGER NOT NULL, author TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sync_runs (id INTEGER PRIMARY KEY, repository TEXT NOT NULL, started_at TEXT NOT NULL, completed_at TEXT, status TEXT NOT NULL, pr_count INTEGER NOT NULL DEFAULT 0, review_count INTEGER NOT NULL DEFAULT 0, comment_count INTEGER NOT NULL DEFAULT 0, error_message TEXT);
  `);
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
    const tempFile = path.join(os.tmpdir(), `em-ct-int-${Date.now()}.db`);
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
