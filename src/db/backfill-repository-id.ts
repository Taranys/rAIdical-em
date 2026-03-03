// Multi-repo support: backfill repositoryId on existing data
// Extracted as a standalone function for testability.
import type Database from "better-sqlite3";

export function backfillRepositoryId(sqlite: InstanceType<typeof Database>): void {
  const ownerRow = sqlite.prepare("SELECT value FROM settings WHERE key = 'github_owner'").get() as { value: string } | undefined;
  const repoRow = sqlite.prepare("SELECT value FROM settings WHERE key = 'github_repo'").get() as { value: string } | undefined;
  if (!ownerRow || !repoRow) return;

  const existing = sqlite
    .prepare("SELECT id FROM repositories WHERE owner = ? AND name = ?")
    .get(ownerRow.value, repoRow.value) as { id: number } | undefined;
  const repoId = existing?.id ?? (sqlite
    .prepare("INSERT INTO repositories (owner, name, added_at) VALUES (?, ?, ?) RETURNING id")
    .get(ownerRow.value, repoRow.value, new Date().toISOString()) as { id: number }).id;

  const tables = ["pull_requests", "reviews", "review_comments", "pr_comments", "sync_runs"];
  for (const table of tables) {
    sqlite.prepare(`UPDATE ${table} SET repository_id = ? WHERE repository_id IS NULL`).run(repoId);
  }
}
