// US-2.10: Seniority profile computation service
import { createLLMServiceFromSettings } from "@/lib/llm";
import type { LLMService } from "@/lib/llm";
import {
  buildSoftSkillPrompt,
  parseSoftSkillResponse,
  isSoftSkillError,
} from "@/lib/llm/soft-skill-assessor";
import { getAllTeamMembers } from "@/db/team-members";
import {
  getClassifiedCommentsForProfile,
  getCategoryDistributionByReviewer,
} from "@/db/comment-classifications";
import {
  upsertSeniorityProfile,
  deleteAllProfiles,
} from "@/db/seniority-profiles";
import { detectLanguage } from "./language-detection";
import {
  TECHNICAL_CATEGORY_DIMENSIONS,
  SOFT_SKILL_DIMENSIONS,
} from "./seniority-dimensions";
import {
  computeDepthScore,
  REVIEW_DEPTH_WEIGHTS,
  type CategoryDistribution,
} from "./review-depth-score";
import type { CommentCategory } from "@/lib/llm/classifier";

// --- Types ---

export interface ComputeProfilesOptions {
  llmService?: LLMService;
  startDate?: string;
  endDate?: string;
}

export interface ComputeProfilesResult {
  status: "success" | "error";
  membersProcessed: number;
  profilesGenerated: number;
  errors: number;
}

type MaturityLevel = "junior" | "experienced" | "senior";

// High-value categories for ratio computation
const HIGH_VALUE_CATEGORIES: Set<string> = new Set([
  "bug_correctness",
  "security",
  "architecture_design",
]);

// --- Maturity level derivation ---

// US-2.10: Derive maturity level for a technical dimension
export function deriveTechnicalMaturityLevel(metrics: {
  depthScore: number;
  volume: number;
  highValueRatio: number;
}): MaturityLevel {
  if (
    metrics.depthScore >= 70 &&
    metrics.volume >= 10 &&
    metrics.highValueRatio >= 0.4
  ) {
    return "senior";
  }
  if (metrics.depthScore >= 40 && metrics.volume >= 5) {
    return "experienced";
  }
  return "junior";
}

// US-2.10: Derive maturity level for a soft skill dimension
export function deriveSoftSkillMaturityLevel(score: number): MaturityLevel {
  if (score >= 70) return "senior";
  if (score >= 40) return "experienced";
  return "junior";
}

// --- Standard deviation helper ---

function standardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.round(Math.sqrt(variance) * 100) / 100;
}

// --- Main entry point ---

export async function computeSeniorityProfiles(
  options: ComputeProfilesOptions = {},
): Promise<ComputeProfilesResult> {
  const llmService = options.llmService ?? createLLMServiceFromSettings();
  const now = new Date();
  const endDate = options.endDate ?? now.toISOString();
  // Default: last 6 months
  const startDate =
    options.startDate ??
    new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString();

  // Clear all existing profiles before recomputing
  deleteAllProfiles();

  const members = getAllTeamMembers();
  const usernames = members.map((m) => m.githubUsername);

  if (members.length === 0) {
    return {
      status: "success",
      membersProcessed: 0,
      profilesGenerated: 0,
      errors: 0,
    };
  }

  // Fetch all data upfront
  let allComments: ReturnType<typeof getClassifiedCommentsForProfile>;
  let allDistributions: ReturnType<typeof getCategoryDistributionByReviewer>;
  try {
    allComments = getClassifiedCommentsForProfile(
      usernames,
      startDate,
      endDate,
    );
    allDistributions = getCategoryDistributionByReviewer(
      usernames,
      startDate,
      endDate,
    );
  } catch {
    return {
      status: "error",
      membersProcessed: 0,
      profilesGenerated: 0,
      errors: members.length,
    };
  }

  let membersProcessed = 0;
  let profilesGenerated = 0;
  let errors = 0;

  for (const member of members) {
    try {
      const memberComments = allComments.filter(
        (c) => c.reviewer === member.githubUsername,
      );
      const memberDistribution = allDistributions.filter(
        (d) => d.reviewer === member.githubUsername,
      );

      if (memberComments.length === 0) continue;

      const totalComments = memberComments.length;
      const highValueCount = memberComments.filter((c) =>
        HIGH_VALUE_CATEGORIES.has(c.category),
      ).length;
      const highValueRatio = totalComments > 0 ? highValueCount / totalComments : 0;

      // Compute overall depth score from category distribution
      const categoryDist: CategoryDistribution[] = memberDistribution.map(
        (d) => ({ category: d.category, count: d.count }),
      );
      const overallDepthScore = computeDepthScore(categoryDist);

      // Compute per-comment depth scores for consistency (stddev)
      const perCommentScores = memberComments.map((c) => {
        const weight =
          REVIEW_DEPTH_WEIGHTS[c.category as CommentCategory] ?? 0;
        return weight;
      });
      const consistency = standardDeviation(perCommentScores);

      // --- Technical language dimensions (from file paths) ---
      const languageCounts = new Map<string, number>();
      for (const comment of memberComments) {
        const lang = detectLanguage(comment.filePath);
        if (lang) {
          languageCounts.set(lang, (languageCounts.get(lang) ?? 0) + 1);
        }
      }

      for (const [lang, volume] of languageCounts) {
        // Compute depth score for comments in this language
        const langComments = memberComments.filter(
          (c) => detectLanguage(c.filePath) === lang,
        );
        const langCatDist = new Map<string, number>();
        for (const c of langComments) {
          langCatDist.set(c.category, (langCatDist.get(c.category) ?? 0) + 1);
        }
        const langDepthScore = computeDepthScore(
          Array.from(langCatDist.entries()).map(([category, count]) => ({
            category,
            count,
          })),
        );
        const langHighValue = langComments.filter((c) =>
          HIGH_VALUE_CATEGORIES.has(c.category),
        ).length;
        const langHighValueRatio = volume > 0 ? langHighValue / volume : 0;

        const maturityLevel = deriveTechnicalMaturityLevel({
          depthScore: langDepthScore,
          volume,
          highValueRatio: langHighValueRatio,
        });

        upsertSeniorityProfile({
          teamMemberId: member.id,
          dimensionName: lang,
          dimensionFamily: "technical",
          maturityLevel,
          supportingMetrics: {
            depthScore: langDepthScore,
            volume,
            highValueRatio: Math.round(langHighValueRatio * 100) / 100,
            consistency,
          },
        });
        profilesGenerated++;
      }

      // --- Technical category dimensions (security, architecture, etc.) ---
      for (const dim of TECHNICAL_CATEGORY_DIMENSIONS) {
        const dimComments = memberComments.filter((c) =>
          dim.sourceCategories.includes(c.category as CommentCategory),
        );
        if (dimComments.length === 0) continue;

        const dimVolume = dimComments.length;
        // For category dimensions, high-value ratio is relative to all comments
        const maturityLevel = deriveTechnicalMaturityLevel({
          depthScore: overallDepthScore,
          volume: dimVolume,
          highValueRatio,
        });

        upsertSeniorityProfile({
          teamMemberId: member.id,
          dimensionName: dim.name,
          dimensionFamily: "technical",
          maturityLevel,
          supportingMetrics: {
            depthScore: overallDepthScore,
            volume: dimVolume,
            totalComments,
            highValueRatio: Math.round(highValueRatio * 100) / 100,
            consistency,
          },
        });
        profilesGenerated++;
      }

      // --- Soft skill dimensions (via LLM) ---
      try {
        const softSkillInput = {
          teamMemberName: member.displayName,
          comments: memberComments.map((c) => ({
            body: c.body,
            category: c.category,
            filePath: c.filePath,
            prTitle: c.prTitle,
          })),
          softSkills: SOFT_SKILL_DIMENSIONS.map((d) => ({
            name: d.name,
            description: d.description,
          })),
        };

        const response = await llmService.classify(
          buildSoftSkillPrompt(softSkillInput),
        );
        const result = parseSoftSkillResponse(response.content);

        if (isSoftSkillError(result)) {
          errors++;
        } else {
          for (const score of result.scores) {
            const maturityLevel = deriveSoftSkillMaturityLevel(score.score);
            upsertSeniorityProfile({
              teamMemberId: member.id,
              dimensionName: score.name,
              dimensionFamily: "soft_skill",
              maturityLevel,
              supportingMetrics: {
                llmScore: score.score,
                reasoning: score.reasoning,
                totalCommentsEvaluated: memberComments.length,
              },
            });
            profilesGenerated++;
          }
        }
      } catch {
        errors++;
      }

      membersProcessed++;
    } catch {
      errors++;
    }
  }

  return {
    status: errors < members.length ? "success" : "error",
    membersProcessed,
    profilesGenerated,
    errors,
  };
}
