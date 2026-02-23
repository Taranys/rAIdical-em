// US-2.09: Unit tests for review depth score computation
import { describe, it, expect } from "vitest";
import {
  computeDepthScore,
  REVIEW_DEPTH_WEIGHTS,
  type CategoryDistribution,
} from "./review-depth-score";

describe("REVIEW_DEPTH_WEIGHTS", () => {
  it("defines a weight for each of the 8 comment categories", () => {
    const categories = [
      "architecture_design",
      "security",
      "bug_correctness",
      "performance",
      "missing_test_coverage",
      "readability_maintainability",
      "question_clarification",
      "nitpick_style",
    ];
    for (const cat of categories) {
      expect(REVIEW_DEPTH_WEIGHTS).toHaveProperty(cat);
      expect(REVIEW_DEPTH_WEIGHTS[cat as keyof typeof REVIEW_DEPTH_WEIGHTS]).toBeGreaterThanOrEqual(0);
      expect(REVIEW_DEPTH_WEIGHTS[cat as keyof typeof REVIEW_DEPTH_WEIGHTS]).toBeLessThanOrEqual(100);
    }
  });

  it("ranks architectural/security higher than nitpick/style", () => {
    expect(REVIEW_DEPTH_WEIGHTS.architecture_design).toBeGreaterThan(
      REVIEW_DEPTH_WEIGHTS.nitpick_style,
    );
    expect(REVIEW_DEPTH_WEIGHTS.security).toBeGreaterThan(
      REVIEW_DEPTH_WEIGHTS.question_clarification,
    );
    expect(REVIEW_DEPTH_WEIGHTS.bug_correctness).toBeGreaterThan(
      REVIEW_DEPTH_WEIGHTS.nitpick_style,
    );
  });
});

describe("computeDepthScore", () => {
  it("returns 0 for an empty distribution", () => {
    expect(computeDepthScore([])).toBe(0);
  });

  it("returns 100 for 100% architecture_design comments", () => {
    const dist: CategoryDistribution[] = [
      { category: "architecture_design", count: 10 },
    ];
    expect(computeDepthScore(dist)).toBe(100);
  });

  it("returns 10 for 100% nitpick_style comments", () => {
    const dist: CategoryDistribution[] = [
      { category: "nitpick_style", count: 5 },
    ];
    expect(computeDepthScore(dist)).toBe(10);
  });

  it("computes weighted average for a mixed distribution", () => {
    // 50% architecture (100) + 50% bug (85) => (5*100 + 5*85) / 10 = 92.5 => 93
    const dist: CategoryDistribution[] = [
      { category: "architecture_design", count: 5 },
      { category: "bug_correctness", count: 5 },
    ];
    expect(computeDepthScore(dist)).toBe(93);
  });

  it("scores based on distribution, not volume (AC #4)", () => {
    // Reviewer A: 80% nitpick (10) + 20% bugs (85) => (80*10 + 20*85)/100 = 25
    const surfaceReviewer: CategoryDistribution[] = [
      { category: "nitpick_style", count: 80 },
      { category: "bug_correctness", count: 20 },
    ];
    // Reviewer B: 50% architecture (100) + 50% bugs (85) => (5*100 + 5*85)/10 = 93
    const deepReviewer: CategoryDistribution[] = [
      { category: "architecture_design", count: 5 },
      { category: "bug_correctness", count: 5 },
    ];

    const surfaceScore = computeDepthScore(surfaceReviewer);
    const deepScore = computeDepthScore(deepReviewer);

    expect(surfaceScore).toBe(25);
    expect(deepScore).toBe(93);
    expect(deepScore).toBeGreaterThan(surfaceScore);
  });

  it("computes the average of all weights for a uniform distribution", () => {
    const dist: CategoryDistribution[] = [
      { category: "architecture_design", count: 1 },
      { category: "security", count: 1 },
      { category: "bug_correctness", count: 1 },
      { category: "performance", count: 1 },
      { category: "missing_test_coverage", count: 1 },
      { category: "readability_maintainability", count: 1 },
      { category: "question_clarification", count: 1 },
      { category: "nitpick_style", count: 1 },
    ];

    const allWeights = Object.values(REVIEW_DEPTH_WEIGHTS);
    const expectedAvg = Math.round(
      allWeights.reduce((s, w) => s + w, 0) / allWeights.length,
    );

    expect(computeDepthScore(dist)).toBe(expectedAvg);
  });

  it("treats unknown categories as weight 0", () => {
    // 1 architecture (100) + 1 unknown (0) => (100 + 0) / 2 = 50
    const dist: CategoryDistribution[] = [
      { category: "architecture_design", count: 1 },
      { category: "totally_unknown_category", count: 1 },
    ];
    expect(computeDepthScore(dist)).toBe(50);
  });

  it("returns the exact weight for a single comment", () => {
    expect(
      computeDepthScore([{ category: "security", count: 1 }]),
    ).toBe(REVIEW_DEPTH_WEIGHTS.security);
    expect(
      computeDepthScore([{ category: "performance", count: 1 }]),
    ).toBe(REVIEW_DEPTH_WEIGHTS.performance);
  });
});
