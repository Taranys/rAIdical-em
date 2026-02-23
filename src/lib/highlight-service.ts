// US-2.12: Best comment highlight detection service
import { createLLMServiceFromSettings } from "@/lib/llm";
import type { LLMService } from "@/lib/llm";
import {
  buildHighlightPrompt,
  parseHighlightResponse,
  isHighlightError,
} from "@/lib/llm/highlight-detector";
import { getAllTeamMembers } from "@/db/team-members";
import { getTopClassifiedCommentsByMember } from "@/db/comment-classifications";
import {
  insertHighlight,
  deleteAllHighlightsByType,
} from "@/db/highlights";

export interface GenerateHighlightsOptions {
  llmService?: LLMService;
  minConfidence?: number;
}

export interface GenerateHighlightsResult {
  status: "success" | "error";
  teamMembersProcessed: number;
  highlightsGenerated: number;
  errors: number;
}

// US-2.12: Main entry point for best comment highlight generation
export async function generateBestCommentHighlights(
  options: GenerateHighlightsOptions = {},
): Promise<GenerateHighlightsResult> {
  const { minConfidence = 70 } = options;
  const llmService = options.llmService ?? createLLMServiceFromSettings();

  // Clear existing best_comment highlights before regenerating
  deleteAllHighlightsByType("best_comment");

  const members = getAllTeamMembers();

  let teamMembersProcessed = 0;
  let highlightsGenerated = 0;
  let errors = 0;

  for (const member of members) {
    try {
      const topComments = getTopClassifiedCommentsByMember(
        member.id,
        minConfidence,
      );

      // Skip members with no high-value comments
      if (topComments.length === 0) {
        continue;
      }

      const prompt = buildHighlightPrompt({
        teamMemberName: member.displayName,
        comments: topComments,
      });

      const response = await llmService.classify(prompt);
      const result = parseHighlightResponse(response.content);

      if (isHighlightError(result)) {
        errors++;
        continue;
      }

      // Validate that selected commentIds exist in the input (no hallucinations)
      const validCommentKeys = new Set(
        topComments.map((c) => `${c.commentType}:${c.commentId}`),
      );

      for (const selection of result.selections) {
        const key = `${selection.commentType}:${selection.commentId}`;
        if (!validCommentKeys.has(key)) {
          continue;
        }

        insertHighlight({
          commentType: selection.commentType,
          commentId: selection.commentId,
          highlightType: "best_comment",
          reasoning: selection.reasoning,
          teamMemberId: member.id,
        });
        highlightsGenerated++;
      }

      teamMembersProcessed++;
    } catch {
      errors++;
    }
  }

  return {
    status: members.length === 0 || errors < members.length ? "success" : "error",
    teamMembersProcessed,
    highlightsGenerated,
    errors,
  };
}
