// US-010: Pull requests data access layer
import { db as defaultDb } from "./index";
import { pullRequests } from "./schema";
import { sql } from "drizzle-orm";

type DbInstance = typeof defaultDb;

export interface PullRequestInput {
  githubId: number;
  number: number;
  title: string;
  author: string;
  state: string;
  createdAt: string;
  mergedAt: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  rawJson: string | null;
}

export function upsertPullRequest(
  input: PullRequestInput,
  dbInstance: DbInstance = defaultDb,
): void {
  dbInstance
    .insert(pullRequests)
    .values(input)
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
        rawJson: input.rawJson,
      },
    })
    .run();
}

export function upsertPullRequests(
  inputs: PullRequestInput[],
  dbInstance: DbInstance = defaultDb,
): void {
  for (const input of inputs) {
    upsertPullRequest(input, dbInstance);
  }
}

export function getPullRequestCount(
  dbInstance: DbInstance = defaultDb,
): number {
  const result = dbInstance
    .select({ count: sql<number>`count(*)` })
    .from(pullRequests)
    .get();
  return result?.count ?? 0;
}
