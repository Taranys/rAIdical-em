// US-010, US-016, US-025: Pull requests data access layer
import { db as defaultDb } from "./index";
import { pullRequests } from "./schema";
import { count, and, gte, lt, inArray, eq, desc, sql } from "drizzle-orm";

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

// PRs merged per team member within a date range
export function getPRsMergedByMember(
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
        eq(pullRequests.state, "merged"),
        gte(pullRequests.mergedAt, startDate),
        lt(pullRequests.mergedAt, endDate),
      ),
    )
    .groupBy(pullRequests.author)
    .orderBy(desc(count()))
    .all();
}

// PRs merged per week within a date range (for trend chart)
export function getPRsMergedPerWeek(
  teamUsernames: string[],
  startDate: string,
  endDate: string,
  dbInstance: DbInstance = defaultDb,
): { week: string; count: number }[] {
  if (teamUsernames.length === 0) return [];

  return dbInstance
    .select({
      week: sql<string>`strftime('%Y-W%W', ${pullRequests.mergedAt})`.as(
        "week",
      ),
      count: count(),
    })
    .from(pullRequests)
    .where(
      and(
        inArray(pullRequests.author, teamUsernames),
        eq(pullRequests.state, "merged"),
        gte(pullRequests.mergedAt, startDate),
        lt(pullRequests.mergedAt, endDate),
      ),
    )
    .groupBy(sql`strftime('%Y-W%W', ${pullRequests.mergedAt})`)
    .orderBy(sql`strftime('%Y-W%W', ${pullRequests.mergedAt})`)
    .all();
}

// US-016: Get average PR size per team member
export function getAvgPRSizeByMember(
  teamUsernames: string[],
  startDate: string,
  endDate: string,
  dbInstance: DbInstance = defaultDb,
): { author: string; avgAdditions: number; avgDeletions: number; prCount: number }[] {
  if (teamUsernames.length === 0) return [];

  return dbInstance
    .select({
      author: pullRequests.author,
      avgAdditions: sql<number>`CAST(AVG(${pullRequests.additions}) AS INTEGER)`.as("avg_additions"),
      avgDeletions: sql<number>`CAST(AVG(${pullRequests.deletions}) AS INTEGER)`.as("avg_deletions"),
      prCount: count(),
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

// US-016: Get individual PRs for a specific member (drill-down)
export function getPRsByMember(
  author: string,
  startDate: string,
  endDate: string,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .select({
      id: pullRequests.id,
      number: pullRequests.number,
      title: pullRequests.title,
      additions: pullRequests.additions,
      deletions: pullRequests.deletions,
      changedFiles: pullRequests.changedFiles,
      createdAt: pullRequests.createdAt,
    })
    .from(pullRequests)
    .where(
      and(
        eq(pullRequests.author, author),
        gte(pullRequests.createdAt, startDate),
        lt(pullRequests.createdAt, endDate),
      ),
    )
    .orderBy(desc(pullRequests.createdAt))
    .all();
}

// US-021: Get AI vs human authorship ratio per team member
export function getAiRatioByMember(
  teamUsernames: string[],
  startDate: string,
  endDate: string,
  dbInstance: DbInstance = defaultDb,
): { author: string; aiGenerated: string; count: number }[] {
  if (teamUsernames.length === 0) return [];

  return dbInstance
    .select({
      author: pullRequests.author,
      aiGenerated: pullRequests.aiGenerated,
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
    .groupBy(pullRequests.author, pullRequests.aiGenerated)
    .all();
}

// US-021: Get team-level AI vs human totals
export function getAiRatioTeamTotal(
  teamUsernames: string[],
  startDate: string,
  endDate: string,
  dbInstance: DbInstance = defaultDb,
): { aiGenerated: string; count: number }[] {
  if (teamUsernames.length === 0) return [];

  return dbInstance
    .select({
      aiGenerated: pullRequests.aiGenerated,
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
    .groupBy(pullRequests.aiGenerated)
    .all();
}

// US-025: Get PR count by author (for sync progress tracking)
export function getPRCountByAuthor(
  startDate: string,
  dbInstance: DbInstance = defaultDb,
): { author: string; count: number }[] {
  return dbInstance
    .select({
      author: pullRequests.author,
      count: count(),
    })
    .from(pullRequests)
    .where(gte(pullRequests.createdAt, startDate))
    .groupBy(pullRequests.author)
    .all();
}
