// US-2.17: Database import API route
import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import { replaceDatabase } from "@/db";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export const dynamic = "force-dynamic";

const REQUIRED_TABLES = [
  "settings",
  "team_members",
  "pull_requests",
  "reviews",
  "review_comments",
  "pr_comments",
  "sync_runs",
];

const SQLITE_MAGIC = "SQLite format 3\0";

export async function POST(request: Request) {
  let tempPath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided. Please upload a SQLite database file." },
        { status: 400 },
      );
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate SQLite magic bytes
    const header = buffer.subarray(0, SQLITE_MAGIC.length).toString("utf-8");
    if (header !== SQLITE_MAGIC) {
      return NextResponse.json(
        { success: false, error: "Invalid file: not a SQLite database." },
        { status: 400 },
      );
    }

    // Write to temp file for validation
    tempPath = path.join(os.tmpdir(), `raidical-import-${Date.now()}.db`);
    fs.writeFileSync(tempPath, buffer);

    // Open temp DB and validate schema
    const tempDb = new Database(tempPath, { readonly: true });
    try {
      const tables = tempDb
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all() as { name: string }[];

      const tableNames = new Set(tables.map((t) => t.name));
      const missing = REQUIRED_TABLES.filter((t) => !tableNames.has(t));

      if (missing.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required tables: ${missing.join(", ")}. The file does not appear to be a valid rAIdical-em database.`,
          },
          { status: 400 },
        );
      }

      // Collect row counts per table
      const tableCounts: Record<string, number> = {};
      for (const table of REQUIRED_TABLES) {
        const row = tempDb.prepare(`SELECT count(*) as count FROM "${table}"`).get() as {
          count: number;
        };
        tableCounts[table] = row.count;
      }

      // Validation passed — close temp DB and replace
      tempDb.close();

      replaceDatabase(tempPath);

      return NextResponse.json({ success: true, tables: tableCounts });
    } finally {
      // Ensure temp DB is closed even on error
      try {
        tempDb.close();
      } catch {
        // Already closed
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error during import.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  } finally {
    // Clean up temp file
    if (tempPath) {
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // Already removed or never created
      }
    }
  }
}
