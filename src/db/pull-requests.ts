// US-010, US-015, US-016, US-021: Pull requests data access layer
import { db as defaultDb } from "./index";
import { pullRequests } from "./schema";
import { count, and, gte, lt, inArray, sql } from "drizzle-orm";

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

// US-015: Get PRs opened per team member within a date range
export function getPRsOpenedByMember(
  teamUsernames: string[],
  startDate: string,
  endDate: string,
  dbInstance: DbInstance = defaultDb,
): { author: string; count: number }[] {
  if (teamUsernames.length === 0) return [];

  return dbInstance
    .select({
      author: pullRequests.author,
      count: count(),
    })
    .from(pullRequests)
    .where(
      and(
        inArray(pullRequests.author, teamUsernames),
        gte(pullRequests.createdAt, startDate),
        lt(pullRequests.createdAt, endDate),
      ),
    )
    .groupBy(pullRequests.author)
    .all();
}

// US-015: Get PRs opened per week within a date range (for trend chart)
export function getPRsOpenedPerWeek(
  teamUsernames: string[],
  startDate: string,
  endDate: string,
  dbInstance: DbInstance = defaultDb,
): { week: string; count: number }[] {
  if (teamUsernames.length === 0) return [];

  return dbInstance
    .select({
      week: sql<string>`strftime('%Y-W%W', ${pullRequests.createdAt})`.as(
        "week",
      ),
      count: count(),
    })
    .from(pullRequests)
    .where(
      and(
        inArray(pullRequests.author, teamUsernames),
        gte(pullRequests.createdAt, startDate),
        lt(pullRequests.createdAt, endDate),
      ),
    )
    .groupBy(sql`strftime('%Y-W%W', ${pullRequests.createdAt})`)
    .orderBy(sql`strftime('%Y-W%W', ${pullRequests.createdAt})`)
    .all();
}
