// US-2.12: Unit tests for best comment detection prompt engineering
import { describe, it, expect } from "vitest";
import {
  buildHighlightPrompt,
  parseHighlightResponse,
  isHighlightError,
  type HighlightInput,
} from "./highlight-detector";

describe("buildHighlightPrompt", () => {
  const sampleInput: HighlightInput = {
    teamMemberName: "Alice",
    comments: [
      {
        commentId: 10,
        commentType: "review_comment",
        body: "This could cause a null pointer exception",
        category: "bug_correctness",
        confidence: 90,
        filePath: "src/app.ts",
        prTitle: "Add feature X",
      },
      {
        commentId: 20,
        commentType: "pr_comment",
        body: "SQL injection risk in this query",
        category: "security",
        confidence: 85,
        filePath: null,
        prTitle: "Add search endpoint",
      },
    ],
  };

  it("includes the team member name", () => {
    const prompt = buildHighlightPrompt(sampleInput);
    expect(prompt).toContain("Alice");
  });

  it("includes the comment bodies", () => {
    const prompt = buildHighlightPrompt(sampleInput);
    expect(prompt).toContain("This could cause a null pointer exception");
    expect(prompt).toContain("SQL injection risk in this query");
  });

  it("includes comment IDs and types", () => {
    const prompt = buildHighlightPrompt(sampleInput);
    expect(prompt).toContain("ID: 10, type: review_comment");
    expect(prompt).toContain("ID: 20, type: pr_comment");
  });

  it("includes categories and confidence", () => {
    const prompt = buildHighlightPrompt(sampleInput);
    expect(prompt).toContain("bug_correctness (confidence: 90%)");
    expect(prompt).toContain("security (confidence: 85%)");
  });

  it("includes file path when provided", () => {
    const prompt = buildHighlightPrompt(sampleInput);
    expect(prompt).toContain("File: src/app.ts");
  });

  it("omits file path when null", () => {
    const prompt = buildHighlightPrompt(sampleInput);
    // The second comment has no filePath — no "File:" line should appear for it
    const lines = prompt.split("\n");
    const comment2Start = lines.findIndex((l) =>
      l.includes("ID: 20, type: pr_comment"),
    );
    const comment2Section = lines.slice(comment2Start, comment2Start + 6);
    expect(comment2Section.some((l) => l.startsWith("File:"))).toBe(false);
  });

  it("includes PR titles", () => {
    const prompt = buildHighlightPrompt(sampleInput);
    expect(prompt).toContain("PR: Add feature X");
    expect(prompt).toContain("PR: Add search endpoint");
  });

  it("requests JSON output format", () => {
    const prompt = buildHighlightPrompt(sampleInput);
    expect(prompt).toContain('"commentId"');
    expect(prompt).toContain('"commentType"');
    expect(prompt).toContain('"reasoning"');
    expect(prompt).toContain('"selections"');
  });

  it("mentions selecting top 3 to 5", () => {
    const prompt = buildHighlightPrompt(sampleInput);
    expect(prompt).toContain("top 3 to 5");
  });

  it("includes the total comment count", () => {
    const prompt = buildHighlightPrompt(sampleInput);
    expect(prompt).toContain("2 high-value review comments");
  });
});

describe("parseHighlightResponse", () => {
  describe("valid responses", () => {
    it("parses a valid JSON response with selections", () => {
      const json = JSON.stringify({
        selections: [
          {
            commentId: 10,
            commentType: "review_comment",
            reasoning: "Excellent bug catch with clear explanation",
          },
          {
            commentId: 20,
            commentType: "pr_comment",
            reasoning: "Important security issue identified",
          },
        ],
      });
      const result = parseHighlightResponse(json);
      expect(isHighlightError(result)).toBe(false);
      if (!isHighlightError(result)) {
        expect(result.selections).toHaveLength(2);
        expect(result.selections[0].commentId).toBe(10);
        expect(result.selections[0].commentType).toBe("review_comment");
        expect(result.selections[0].reasoning).toBe(
          "Excellent bug catch with clear explanation",
        );
        expect(result.selections[1].commentId).toBe(20);
      }
    });

    it("strips markdown code fences", () => {
      const raw =
        '```json\n{"selections":[{"commentId":10,"commentType":"review_comment","reasoning":"Great catch"}]}\n```';
      const result = parseHighlightResponse(raw);
      expect(isHighlightError(result)).toBe(false);
      if (!isHighlightError(result)) {
        expect(result.selections).toHaveLength(1);
      }
    });

    it("strips fences without json language tag", () => {
      const raw =
        '```\n{"selections":[{"commentId":10,"commentType":"review_comment","reasoning":"Good"}]}\n```';
      const result = parseHighlightResponse(raw);
      expect(isHighlightError(result)).toBe(false);
    });

    it("trims whitespace from reasoning", () => {
      const json = JSON.stringify({
        selections: [
          {
            commentId: 10,
            commentType: "review_comment",
            reasoning: "  Well articulated bug report  ",
          },
        ],
      });
      const result = parseHighlightResponse(json);
      if (!isHighlightError(result)) {
        expect(result.selections[0].reasoning).toBe(
          "Well articulated bug report",
        );
      }
    });

    it("handles empty selections array", () => {
      const json = JSON.stringify({ selections: [] });
      const result = parseHighlightResponse(json);
      expect(isHighlightError(result)).toBe(false);
      if (!isHighlightError(result)) {
        expect(result.selections).toHaveLength(0);
      }
    });
  });

  describe("invalid responses", () => {
    it("returns error for non-JSON content", () => {
      const result = parseHighlightResponse("not json at all");
      expect(isHighlightError(result)).toBe(true);
      if (isHighlightError(result)) {
        expect(result.error).toContain("not valid JSON");
        expect(result.rawContent).toBe("not json at all");
      }
    });

    it("returns error for JSON array", () => {
      const result = parseHighlightResponse("[1, 2, 3]");
      expect(isHighlightError(result)).toBe(true);
      if (isHighlightError(result)) {
        expect(result.error).toContain("not a JSON object");
      }
    });

    it("returns error for missing selections array", () => {
      const result = parseHighlightResponse('{"foo": "bar"}');
      expect(isHighlightError(result)).toBe(true);
      if (isHighlightError(result)) {
        expect(result.error).toContain("selections");
      }
    });

    it("returns error for non-array selections", () => {
      const result = parseHighlightResponse('{"selections": "not array"}');
      expect(isHighlightError(result)).toBe(true);
    });

    it("returns error for invalid commentId", () => {
      const json = JSON.stringify({
        selections: [
          {
            commentId: "not-a-number",
            commentType: "review_comment",
            reasoning: "Good",
          },
        ],
      });
      const result = parseHighlightResponse(json);
      expect(isHighlightError(result)).toBe(true);
      if (isHighlightError(result)) {
        expect(result.error).toContain("commentId");
      }
    });

    it("returns error for invalid commentType", () => {
      const json = JSON.stringify({
        selections: [
          {
            commentId: 10,
            commentType: "unknown_type",
            reasoning: "Good",
          },
        ],
      });
      const result = parseHighlightResponse(json);
      expect(isHighlightError(result)).toBe(true);
      if (isHighlightError(result)) {
        expect(result.error).toContain("commentType");
      }
    });

    it("returns error for empty reasoning", () => {
      const json = JSON.stringify({
        selections: [
          {
            commentId: 10,
            commentType: "review_comment",
            reasoning: "",
          },
        ],
      });
      const result = parseHighlightResponse(json);
      expect(isHighlightError(result)).toBe(true);
      if (isHighlightError(result)) {
        expect(result.error).toContain("reasoning");
      }
    });

    it("returns error for missing reasoning", () => {
      const json = JSON.stringify({
        selections: [
          { commentId: 10, commentType: "review_comment" },
        ],
      });
      const result = parseHighlightResponse(json);
      expect(isHighlightError(result)).toBe(true);
    });

    it("returns error for null selection item", () => {
      const json = JSON.stringify({ selections: [null] });
      const result = parseHighlightResponse(json);
      expect(isHighlightError(result)).toBe(true);
      if (isHighlightError(result)) {
        expect(result.error).toContain("not an object");
      }
    });

    it("returns error for empty string", () => {
      const result = parseHighlightResponse("");
      expect(isHighlightError(result)).toBe(true);
    });
  });
});

describe("isHighlightError", () => {
  it("returns true for HighlightParseError", () => {
    expect(isHighlightError({ error: "bad", rawContent: "x" })).toBe(true);
  });

  it("returns false for HighlightResult", () => {
    expect(
      isHighlightError({
        selections: [
          {
            commentId: 10,
            commentType: "review_comment",
            reasoning: "Great comment",
          },
        ],
      }),
    ).toBe(false);
  });
});
