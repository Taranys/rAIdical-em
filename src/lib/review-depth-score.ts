// US-2.09: Review depth score computation
import type { CommentCategory } from "@/lib/llm/classifier";

// --- Types ---

export interface CategoryDistribution {
  category: string;
  count: number;
}

export interface DepthScoreResult {
  reviewer: string;
  score: number; // 0-100, rounded to nearest integer
  totalComments: number;
  categoryBreakdown: CategoryDistribution[];
}

// --- Scoring weights ---
// Higher weight = deeper, more architectural review behavior
// These are defined as constants (US-2.09 AC #3)

export const REVIEW_DEPTH_WEIGHTS: Record<CommentCategory, number> = {
  architecture_design: 100,
  security: 90,
  bug_correctness: 85,
  performance: 75,
  missing_test_coverage: 65,
  readability_maintainability: 45,
  question_clarification: 30,
  nitpick_style: 10,
};

// --- Score computation ---

/**
 * Computes a depth score (0-100) from a category distribution.
 * The score is a weighted average based on distribution, not volume (US-2.09 AC #4).
 */
export function computeDepthScore(
  categoryDistribution: CategoryDistribution[],
): number {
  const totalComments = categoryDistribution.reduce(
    (sum, c) => sum + c.count,
    0,
  );
  if (totalComments === 0) return 0;

  const weightedSum = categoryDistribution.reduce((sum, c) => {
    const weight =
      REVIEW_DEPTH_WEIGHTS[c.category as CommentCategory] ?? 0;
    return sum + c.count * weight;
  }, 0);

  return Math.round(weightedSum / totalComments);
}
