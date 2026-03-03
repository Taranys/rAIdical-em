// Task 7.2 + 7.3: Unit tests for buildClassificationPrompt and parseClassificationResponse with custom categories
import { describe, it, expect } from "vitest";
import {
  buildClassificationPrompt,
  parseClassificationResponse,
  isClassificationError,
  COMMENT_CATEGORIES,
  type ClassificationInput,
  type CategoryDefinition,
} from "./classifier";

const CUSTOM_CATEGORIES: CategoryDefinition[] = [
  { slug: "ux_issue", description: "Points out UX problems or confusing user flows" },
  { slug: "data_integrity", description: "Flags data corruption, race conditions, or consistency issues" },
  { slug: "documentation", description: "Missing or incorrect documentation, comments, or README changes" },
];

describe("buildClassificationPrompt with custom categories", () => {
  const input: ClassificationInput = { body: "This button label is confusing" };

  it("includes custom category slugs in the prompt", () => {
    const prompt = buildClassificationPrompt(input, CUSTOM_CATEGORIES);
    for (const cat of CUSTOM_CATEGORIES) {
      expect(prompt).toContain(cat.slug);
    }
  });

  it("includes custom category descriptions in the prompt", () => {
    const prompt = buildClassificationPrompt(input, CUSTOM_CATEGORIES);
    for (const cat of CUSTOM_CATEGORIES) {
      expect(prompt).toContain(cat.description);
    }
  });

  it("does NOT include hardcoded categories when custom ones are provided", () => {
    const prompt = buildClassificationPrompt(input, CUSTOM_CATEGORIES);
    // Hardcoded categories should not appear
    for (const cat of COMMENT_CATEGORIES) {
      expect(prompt).not.toContain(`- ${cat}:`);
    }
  });

  it("uses last custom category slug for short-comment fallback rule", () => {
    const prompt = buildClassificationPrompt(input, CUSTOM_CATEGORIES);
    const lastSlug = CUSTOM_CATEGORIES[CUSTOM_CATEGORIES.length - 1].slug;
    expect(prompt).toContain(`"${lastSlug}"`);
  });

  it("uses first custom category slug for bot-generated comment rule", () => {
    const prompt = buildClassificationPrompt(input, CUSTOM_CATEGORIES);
    const firstSlug = CUSTOM_CATEGORIES[0].slug;
    expect(prompt).toContain(`"${firstSlug}"`);
  });

  it("mentions the correct number of categories", () => {
    const prompt = buildClassificationPrompt(input, CUSTOM_CATEGORIES);
    expect(prompt).toContain(`${CUSTOM_CATEGORIES.length} categories`);
  });

  it("falls back to default categories when undefined is passed", () => {
    const prompt = buildClassificationPrompt(input, undefined);
    for (const cat of COMMENT_CATEGORIES) {
      expect(prompt).toContain(cat);
    }
  });

  it("falls back to default categories when empty array is passed", () => {
    const prompt = buildClassificationPrompt(input, []);
    for (const cat of COMMENT_CATEGORIES) {
      expect(prompt).toContain(cat);
    }
  });

  it("includes optional context when provided with custom categories", () => {
    const contextInput: ClassificationInput = {
      body: "This feels wrong",
      filePath: "src/ui/button.tsx",
      prTitle: "Redesign button component",
    };
    const prompt = buildClassificationPrompt(contextInput, CUSTOM_CATEGORIES);
    expect(prompt).toContain("src/ui/button.tsx");
    expect(prompt).toContain("Redesign button component");
    expect(prompt).toContain("Context:");
  });

  it("works with a single custom category", () => {
    const singleCat: CategoryDefinition[] = [
      { slug: "misc", description: "Miscellaneous comments" },
    ];
    const prompt = buildClassificationPrompt(input, singleCat);
    expect(prompt).toContain("misc");
    expect(prompt).toContain("1 categories");
  });
});

describe("parseClassificationResponse with custom validSlugs", () => {
  const customSlugs = ["ux_issue", "data_integrity", "documentation"];

  describe("valid responses with custom slugs", () => {
    it("accepts a custom category slug", () => {
      const json = JSON.stringify({
        category: "ux_issue",
        confidence: 0.85,
        reasoning: "The button label is confusing for users",
      });
      const result = parseClassificationResponse(json, customSlugs);
      expect(isClassificationError(result)).toBe(false);
      if (!isClassificationError(result)) {
        expect(result.category).toBe("ux_issue");
        expect(result.confidence).toBe(85);
      }
    });

    it("accepts all custom slugs", () => {
      for (const slug of customSlugs) {
        const json = JSON.stringify({
          category: slug,
          confidence: 0.7,
          reasoning: "Test reasoning",
        });
        const result = parseClassificationResponse(json, customSlugs);
        expect(isClassificationError(result)).toBe(false);
        if (!isClassificationError(result)) {
          expect(result.category).toBe(slug);
        }
      }
    });
  });

  describe("invalid responses with custom slugs", () => {
    it("rejects a hardcoded category when custom slugs are provided", () => {
      const json = JSON.stringify({
        category: "bug_correctness",
        confidence: 0.9,
        reasoning: "Found a bug",
      });
      const result = parseClassificationResponse(json, customSlugs);
      expect(isClassificationError(result)).toBe(true);
      if (isClassificationError(result)) {
        expect(result.error).toContain("Invalid category");
      }
    });

    it("rejects an unknown category slug", () => {
      const json = JSON.stringify({
        category: "totally_unknown",
        confidence: 0.5,
        reasoning: "Whatever",
      });
      const result = parseClassificationResponse(json, customSlugs);
      expect(isClassificationError(result)).toBe(true);
      if (isClassificationError(result)) {
        expect(result.error).toContain("Invalid category");
      }
    });
  });

  describe("fallback to default slugs", () => {
    it("accepts hardcoded categories when no validSlugs provided", () => {
      const json = JSON.stringify({
        category: "bug_correctness",
        confidence: 0.9,
        reasoning: "Found a bug",
      });
      const result = parseClassificationResponse(json);
      expect(isClassificationError(result)).toBe(false);
    });

    it("accepts hardcoded categories when undefined passed", () => {
      const json = JSON.stringify({
        category: "security",
        confidence: 0.8,
        reasoning: "Security issue",
      });
      const result = parseClassificationResponse(json, undefined);
      expect(isClassificationError(result)).toBe(false);
    });

    it("rejects custom category when using default slugs", () => {
      const json = JSON.stringify({
        category: "ux_issue",
        confidence: 0.7,
        reasoning: "UX problem",
      });
      const result = parseClassificationResponse(json);
      expect(isClassificationError(result)).toBe(true);
    });
  });
});
