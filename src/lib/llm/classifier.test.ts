// US-2.04: Unit tests for classification prompt engineering
import { describe, it, expect } from "vitest";
import {
  buildClassificationPrompt,
  parseClassificationResponse,
  isClassificationError,
  COMMENT_CATEGORIES,
  type ClassificationInput,
} from "./classifier";

describe("buildClassificationPrompt", () => {
  it("includes the comment body in the prompt", () => {
    const input: ClassificationInput = { body: "This variable is never used." };
    const prompt = buildClassificationPrompt(input);
    expect(prompt).toContain("This variable is never used.");
  });

  it("includes all 8 categories in the prompt", () => {
    const input: ClassificationInput = { body: "test" };
    const prompt = buildClassificationPrompt(input);
    for (const category of COMMENT_CATEGORIES) {
      expect(prompt).toContain(category);
    }
  });

  it("includes optional context when provided", () => {
    const input: ClassificationInput = {
      body: "Potential SQL injection here",
      filePath: "src/db/queries.ts",
      prTitle: "Add user search endpoint",
      diffSnippet: '+ const query = `SELECT * FROM users WHERE name = ${name}`;',
    };
    const prompt = buildClassificationPrompt(input);
    expect(prompt).toContain("src/db/queries.ts");
    expect(prompt).toContain("Add user search endpoint");
    expect(prompt).toContain("SELECT * FROM users");
  });

  it("omits context section when no optional fields are provided", () => {
    const input: ClassificationInput = { body: "Looks good" };
    const prompt = buildClassificationPrompt(input);
    expect(prompt).not.toContain("Context:");
  });

  it("mentions edge cases for short comments and bots", () => {
    const input: ClassificationInput = { body: "test" };
    const prompt = buildClassificationPrompt(input);
    expect(prompt).toMatch(/LGTM/i);
    expect(prompt).toMatch(/bot/i);
  });

  it("requests JSON output format", () => {
    const input: ClassificationInput = { body: "test" };
    const prompt = buildClassificationPrompt(input);
    expect(prompt).toContain('"category"');
    expect(prompt).toContain('"confidence"');
    expect(prompt).toContain('"reasoning"');
  });
});

describe("parseClassificationResponse", () => {
  describe("valid responses", () => {
    it("parses a valid JSON response and converts confidence to 0-100", () => {
      const json = JSON.stringify({
        category: "bug_correctness",
        confidence: 0.9,
        reasoning: "Points out a null check issue",
      });
      const result = parseClassificationResponse(json);
      expect(isClassificationError(result)).toBe(false);
      if (!isClassificationError(result)) {
        expect(result.category).toBe("bug_correctness");
        expect(result.confidence).toBe(90);
        expect(result.reasoning).toBe("Points out a null check issue");
      }
    });

    it("converts confidence 0.5 to 50", () => {
      const json = JSON.stringify({
        category: "security",
        confidence: 0.5,
        reasoning: "Possible vulnerability",
      });
      const result = parseClassificationResponse(json);
      if (!isClassificationError(result)) {
        expect(result.confidence).toBe(50);
      }
    });

    it("converts confidence 0.0 to 0", () => {
      const json = JSON.stringify({
        category: "nitpick_style",
        confidence: 0.0,
        reasoning: "Very uncertain",
      });
      const result = parseClassificationResponse(json);
      if (!isClassificationError(result)) {
        expect(result.confidence).toBe(0);
      }
    });

    it("converts confidence 1.0 to 100", () => {
      const json = JSON.stringify({
        category: "performance",
        confidence: 1.0,
        reasoning: "Clear perf issue",
      });
      const result = parseClassificationResponse(json);
      if (!isClassificationError(result)) {
        expect(result.confidence).toBe(100);
      }
    });

    it("trims whitespace from reasoning", () => {
      const json = JSON.stringify({
        category: "readability_maintainability",
        confidence: 0.7,
        reasoning: "  Naming could be clearer  ",
      });
      const result = parseClassificationResponse(json);
      if (!isClassificationError(result)) {
        expect(result.reasoning).toBe("Naming could be clearer");
      }
    });

    it("strips markdown code fences from response", () => {
      const raw = '```json\n{"category":"architecture_design","confidence":0.8,"reasoning":"Design concern"}\n```';
      const result = parseClassificationResponse(raw);
      expect(isClassificationError(result)).toBe(false);
      if (!isClassificationError(result)) {
        expect(result.category).toBe("architecture_design");
        expect(result.confidence).toBe(80);
      }
    });

    it("strips fences without json language tag", () => {
      const raw = '```\n{"category":"security","confidence":0.6,"reasoning":"Unsafe input"}\n```';
      const result = parseClassificationResponse(raw);
      expect(isClassificationError(result)).toBe(false);
      if (!isClassificationError(result)) {
        expect(result.category).toBe("security");
      }
    });

    it("accepts all 8 categories", () => {
      for (const category of COMMENT_CATEGORIES) {
        const json = JSON.stringify({
          category,
          confidence: 0.75,
          reasoning: "Test reasoning",
        });
        const result = parseClassificationResponse(json);
        expect(isClassificationError(result)).toBe(false);
        if (!isClassificationError(result)) {
          expect(result.category).toBe(category);
        }
      }
    });
  });

  describe("invalid responses", () => {
    it("returns error for non-JSON content", () => {
      const result = parseClassificationResponse("this is not json");
      expect(isClassificationError(result)).toBe(true);
      if (isClassificationError(result)) {
        expect(result.error).toContain("not valid JSON");
        expect(result.rawContent).toBe("this is not json");
      }
    });

    it("returns error for JSON array", () => {
      const result = parseClassificationResponse("[1, 2, 3]");
      expect(isClassificationError(result)).toBe(true);
      if (isClassificationError(result)) {
        expect(result.error).toContain("not a JSON object");
      }
    });

    it("returns error for invalid category", () => {
      const json = JSON.stringify({
        category: "unknown_category",
        confidence: 0.5,
        reasoning: "Something",
      });
      const result = parseClassificationResponse(json);
      expect(isClassificationError(result)).toBe(true);
      if (isClassificationError(result)) {
        expect(result.error).toContain("Invalid category");
      }
    });

    it("returns error for missing category", () => {
      const json = JSON.stringify({
        confidence: 0.5,
        reasoning: "Something",
      });
      const result = parseClassificationResponse(json);
      expect(isClassificationError(result)).toBe(true);
    });

    it("returns error for confidence > 1", () => {
      const json = JSON.stringify({
        category: "security",
        confidence: 1.5,
        reasoning: "Something",
      });
      const result = parseClassificationResponse(json);
      expect(isClassificationError(result)).toBe(true);
      if (isClassificationError(result)) {
        expect(result.error).toContain("Invalid confidence");
      }
    });

    it("returns error for confidence < 0", () => {
      const json = JSON.stringify({
        category: "security",
        confidence: -0.1,
        reasoning: "Something",
      });
      const result = parseClassificationResponse(json);
      expect(isClassificationError(result)).toBe(true);
    });

    it("returns error for non-numeric confidence", () => {
      const result = parseClassificationResponse(
        '{"category":"security","confidence":"high","reasoning":"x"}'
      );
      expect(isClassificationError(result)).toBe(true);
    });

    it("returns error for empty reasoning", () => {
      const json = JSON.stringify({
        category: "security",
        confidence: 0.8,
        reasoning: "",
      });
      const result = parseClassificationResponse(json);
      expect(isClassificationError(result)).toBe(true);
      if (isClassificationError(result)) {
        expect(result.error).toContain("reasoning");
      }
    });

    it("returns error for missing reasoning", () => {
      const json = JSON.stringify({
        category: "security",
        confidence: 0.8,
      });
      const result = parseClassificationResponse(json);
      expect(isClassificationError(result)).toBe(true);
    });

    it("returns error for empty string", () => {
      const result = parseClassificationResponse("");
      expect(isClassificationError(result)).toBe(true);
    });
  });
});

describe("isClassificationError", () => {
  it("returns true for ClassificationParseError", () => {
    expect(isClassificationError({ error: "bad", rawContent: "x" })).toBe(true);
  });

  it("returns false for ClassificationResult", () => {
    expect(
      isClassificationError({
        category: "bug_correctness",
        confidence: 90,
        reasoning: "Found a bug",
      })
    ).toBe(false);
  });
});

describe("COMMENT_CATEGORIES", () => {
  it("contains exactly 8 categories", () => {
    expect(COMMENT_CATEGORIES).toHaveLength(8);
  });

  it("contains all expected categories", () => {
    const expected = [
      "bug_correctness",
      "security",
      "performance",
      "readability_maintainability",
      "nitpick_style",
      "architecture_design",
      "missing_test_coverage",
      "question_clarification",
    ];
    expect(COMMENT_CATEGORIES).toEqual(expected);
  });
});
