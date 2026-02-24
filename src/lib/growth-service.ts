// US-2.13: Growth opportunity detection service
import { createLLMServiceFromSettings } from "@/lib/llm";
import type { LLMService } from "@/lib/llm";
import {
  buildGrowthOpportunityPrompt,
  parseGrowthOpportunityResponse,
  isGrowthOpportunityError,
} from "@/lib/llm/growth-detector";
import { getAllTeamMembers } from "@/db/team-members";
import { getLowDepthCommentsByMember } from "@/db/comment-classifications";
import {
  insertHighlight,
  deleteAllHighlightsByType,
} from "@/db/highlights";

export interface GenerateGrowthOpportunitiesOptions {
  llmService?: LLMService;
  minConfidence?: number;
}

export interface GenerateGrowthOpportunitiesResult {
  status: "success" | "error";
  teamMembersProcessed: number;
  opportunitiesGenerated: number;
  errors: number;
}

// US-2.13: Main entry point for growth opportunity detection
export async function generateGrowthOpportunities(
  options: GenerateGrowthOpportunitiesOptions = {},
): Promise<GenerateGrowthOpportunitiesResult> {
  const { minConfidence = 50 } = options;
  const llmService = options.llmService ?? createLLMServiceFromSettings();

  // Clear existing growth_opportunity highlights before regenerating
  deleteAllHighlightsByType("growth_opportunity");

  const members = getAllTeamMembers();

  let teamMembersProcessed = 0;
  let opportunitiesGenerated = 0;
  let errors = 0;

  for (const member of members) {
    try {
      const lowDepthComments = getLowDepthCommentsByMember(
        member.id,
        minConfidence,
      );

      // Skip members with no low-depth comments
      if (lowDepthComments.length === 0) {
        continue;
      }

      const prompt = buildGrowthOpportunityPrompt({
        teamMemberName: member.displayName,
        comments: lowDepthComments,
      });

      const response = await llmService.classify(prompt);
      const result = parseGrowthOpportunityResponse(response.content);

      if (isGrowthOpportunityError(result)) {
        errors++;
        continue;
      }

      // Validate that selected commentIds exist in the input (no hallucinations)
      const validCommentKeys = new Set(
        lowDepthComments.map((c) => `${c.commentType}:${c.commentId}`),
      );

      for (const opportunity of result.opportunities) {
        const key = `${opportunity.commentType}:${opportunity.commentId}`;
        if (!validCommentKeys.has(key)) {
          continue;
        }

        insertHighlight({
          commentType: opportunity.commentType,
          commentId: opportunity.commentId,
          highlightType: "growth_opportunity",
          reasoning: opportunity.suggestion,
          teamMemberId: member.id,
        });
        opportunitiesGenerated++;
      }

      teamMembersProcessed++;
    } catch {
      errors++;
    }
  }

  return {
    status: members.length === 0 || errors < members.length ? "success" : "error",
    teamMembersProcessed,
    opportunitiesGenerated,
    errors,
  };
}
