// US-010: Pull requests data access layer
import { db as defaultDb } from "./index";
import { pullRequests } from "./schema";
import { count } from "drizzle-orm";

type DbInstance = typeof defaultDb;

export interface PullRequestInput {
  githubId: number;
  number: number;
  title: string;
  author: string;
  state: "open" | "closed" | "merged";
  createdAt: string;
  mergedAt: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
}

export function upsertPullRequest(
  input: PullRequestInput,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .insert(pullRequests)
    .values({
      githubId: input.githubId,
      number: input.number,
      title: input.title,
      author: input.author,
      state: input.state,
      createdAt: input.createdAt,
      mergedAt: input.mergedAt,
      additions: input.additions,
      deletions: input.deletions,
      changedFiles: input.changedFiles,
    })
    .onConflictDoUpdate({
      target: pullRequests.githubId,
      set: {
        number: input.number,
        title: input.title,
        author: input.author,
        state: input.state,
        createdAt: input.createdAt,
        mergedAt: input.mergedAt,
        additions: input.additions,
        deletions: input.deletions,
        changedFiles: input.changedFiles,
      },
    })
    .returning()
    .get();
}

export function getPullRequestCount(
  dbInstance: DbInstance = defaultDb,
): number {
  const result = dbInstance
    .select({ count: count() })
    .from(pullRequests)
    .get();

  return result?.count ?? 0;
}
