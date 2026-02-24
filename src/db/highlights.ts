// US-2.12: Highlights data access layer
import { db as defaultDb } from "./index";
import { highlights } from "./schema";
import { eq, and } from "drizzle-orm";

type DbInstance = typeof defaultDb;

// --- Types ---

export interface HighlightInsert {
  commentType: "review_comment" | "pr_comment";
  commentId: number;
  highlightType: "best_comment" | "growth_opportunity";
  reasoning: string;
  teamMemberId: number;
}

// --- Mutations ---

// US-2.12: Insert a single highlight
export function insertHighlight(
  data: HighlightInsert,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .insert(highlights)
    .values({
      commentType: data.commentType,
      commentId: data.commentId,
      highlightType: data.highlightType,
      reasoning: data.reasoning,
      teamMemberId: data.teamMemberId,
      createdAt: new Date().toISOString(),
    })
    .returning()
    .get();
}

// --- Queries ---

// US-2.12: Get highlights for a team member, optionally filtered by type
export function getHighlightsByTeamMember(
  teamMemberId: number,
  highlightType?: "best_comment" | "growth_opportunity",
  dbInstance: DbInstance = defaultDb,
) {
  if (highlightType) {
    return dbInstance
      .select()
      .from(highlights)
      .where(
        and(
          eq(highlights.teamMemberId, teamMemberId),
          eq(highlights.highlightType, highlightType),
        ),
      )
      .all();
  }
  return dbInstance
    .select()
    .from(highlights)
    .where(eq(highlights.teamMemberId, teamMemberId))
    .all();
}

// --- Deletions ---

// US-2.12: Delete all highlights of a given type (for full re-generation)
export function deleteAllHighlightsByType(
  highlightType: "best_comment" | "growth_opportunity",
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .delete(highlights)
    .where(eq(highlights.highlightType, highlightType))
    .run();
}
