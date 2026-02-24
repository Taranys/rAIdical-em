// US-2.13: Unit tests for growth opportunity detection prompt engineering
import { describe, it, expect } from "vitest";
import {
  buildGrowthOpportunityPrompt,
  parseGrowthOpportunityResponse,
  isGrowthOpportunityError,
  type GrowthOpportunityInput,
} from "./growth-detector";

describe("buildGrowthOpportunityPrompt", () => {
  const sampleInput: GrowthOpportunityInput = {
    teamMemberName: "Bob",
    comments: [
      {
        commentId: 10,
        commentType: "review_comment",
        body: "Nitpick: missing semicolon",
        category: "nitpick_style",
        confidence: 80,
        filePath: "src/app.ts",
        prTitle: "Add feature X",
        prHadHighValueIssues: true,
      },
      {
        commentId: 20,
        commentType: "pr_comment",
        body: "What does this function do?",
        category: "question_clarification",
        confidence: 65,
        filePath: null,
        prTitle: "Fix login flow",
        prHadHighValueIssues: false,
      },
    ],
  };

  it("includes the team member name", () => {
    const prompt = buildGrowthOpportunityPrompt(sampleInput);
    expect(prompt).toContain("Bob");
  });

  it("includes the comment bodies", () => {
    const prompt = buildGrowthOpportunityPrompt(sampleInput);
    expect(prompt).toContain("Nitpick: missing semicolon");
    expect(prompt).toContain("What does this function do?");
  });

  it("includes comment IDs and types", () => {
    const prompt = buildGrowthOpportunityPrompt(sampleInput);
    expect(prompt).toContain("ID: 10, type: review_comment");
    expect(prompt).toContain("ID: 20, type: pr_comment");
  });

  it("includes categories and confidence", () => {
    const prompt = buildGrowthOpportunityPrompt(sampleInput);
    expect(prompt).toContain("nitpick_style (confidence: 80%)");
    expect(prompt).toContain("question_clarification (confidence: 65%)");
  });

  it("includes file path when provided", () => {
    const prompt = buildGrowthOpportunityPrompt(sampleInput);
    expect(prompt).toContain("File: src/app.ts");
  });

  it("omits file path when null", () => {
    const prompt = buildGrowthOpportunityPrompt(sampleInput);
    const lines = prompt.split("\n");
    const comment2Start = lines.findIndex((l) =>
      l.includes("ID: 20, type: pr_comment"),
    );
    const comment2Section = lines.slice(comment2Start, comment2Start + 6);
    expect(comment2Section.some((l) => l.startsWith("File:"))).toBe(false);
  });

  it("includes PR titles", () => {
    const prompt = buildGrowthOpportunityPrompt(sampleInput);
    expect(prompt).toContain("PR: Add feature X");
    expect(prompt).toContain("PR: Fix login flow");
  });

  it("shows warning marker for PRs with high-value issues from others", () => {
    const prompt = buildGrowthOpportunityPrompt(sampleInput);
    // Comment 10 has prHadHighValueIssues=true
    expect(prompt).toContain(
      "⚠️ Context: Other reviewers found serious issues (bug/security) in this same PR",
    );
  });

  it("does not show context warning for comments without high-value issues on PR", () => {
    const input: GrowthOpportunityInput = {
      teamMemberName: "Bob",
      comments: [
        {
          commentId: 20,
          commentType: "pr_comment",
          body: "What does this do?",
          category: "question_clarification",
          confidence: 65,
          filePath: null,
          prTitle: "Fix login",
          prHadHighValueIssues: false,
        },
      ],
    };
    const prompt = buildGrowthOpportunityPrompt(input);
    // The ⚠️ Context line should not appear in the comment section (it may appear in instructions)
    expect(prompt).not.toContain(
      "⚠️ Context: Other reviewers found serious issues",
    );
  });

  it("requests JSON output format with opportunities structure", () => {
    const prompt = buildGrowthOpportunityPrompt(sampleInput);
    expect(prompt).toContain('"commentId"');
    expect(prompt).toContain('"commentType"');
    expect(prompt).toContain('"suggestion"');
    expect(prompt).toContain('"opportunities"');
  });

  it("mentions selecting up to 3 opportunities", () => {
    const prompt = buildGrowthOpportunityPrompt(sampleInput);
    expect(prompt).toContain("up to 3");
  });

  it("includes the total comment count", () => {
    const prompt = buildGrowthOpportunityPrompt(sampleInput);
    expect(prompt).toContain("2 lower-depth review comments");
  });
});

describe("parseGrowthOpportunityResponse", () => {
  describe("valid responses", () => {
    it("parses a valid JSON response with opportunities", () => {
      const json = JSON.stringify({
        opportunities: [
          {
            commentId: 10,
            commentType: "review_comment",
            suggestion:
              "Instead of focusing on the semicolon, examine the data flow. The function lacks null checks that could cause runtime errors.",
          },
          {
            commentId: 20,
            commentType: "pr_comment",
            suggestion:
              "Rather than asking what the function does, review the authentication logic for potential bypass vulnerabilities.",
          },
        ],
      });
      const result = parseGrowthOpportunityResponse(json);
      expect(isGrowthOpportunityError(result)).toBe(false);
      if (!isGrowthOpportunityError(result)) {
        expect(result.opportunities).toHaveLength(2);
        expect(result.opportunities[0].commentId).toBe(10);
        expect(result.opportunities[0].commentType).toBe("review_comment");
        expect(result.opportunities[0].suggestion).toContain("semicolon");
        expect(result.opportunities[1].commentId).toBe(20);
      }
    });

    it("strips markdown code fences", () => {
      const raw =
        '```json\n{"opportunities":[{"commentId":10,"commentType":"review_comment","suggestion":"Go deeper here"}]}\n```';
      const result = parseGrowthOpportunityResponse(raw);
      expect(isGrowthOpportunityError(result)).toBe(false);
      if (!isGrowthOpportunityError(result)) {
        expect(result.opportunities).toHaveLength(1);
      }
    });

    it("strips fences without json language tag", () => {
      const raw =
        '```\n{"opportunities":[{"commentId":10,"commentType":"review_comment","suggestion":"Go deeper"}]}\n```';
      const result = parseGrowthOpportunityResponse(raw);
      expect(isGrowthOpportunityError(result)).toBe(false);
    });

    it("trims whitespace from suggestion", () => {
      const json = JSON.stringify({
        opportunities: [
          {
            commentId: 10,
            commentType: "review_comment",
            suggestion: "  Look for null pointer issues instead  ",
          },
        ],
      });
      const result = parseGrowthOpportunityResponse(json);
      if (!isGrowthOpportunityError(result)) {
        expect(result.opportunities[0].suggestion).toBe(
          "Look for null pointer issues instead",
        );
      }
    });

    it("handles empty opportunities array (no growth opportunities found)", () => {
      const json = JSON.stringify({ opportunities: [] });
      const result = parseGrowthOpportunityResponse(json);
      expect(isGrowthOpportunityError(result)).toBe(false);
      if (!isGrowthOpportunityError(result)) {
        expect(result.opportunities).toHaveLength(0);
      }
    });
  });

  describe("invalid responses", () => {
    it("returns error for non-JSON content", () => {
      const result = parseGrowthOpportunityResponse("not json at all");
      expect(isGrowthOpportunityError(result)).toBe(true);
      if (isGrowthOpportunityError(result)) {
        expect(result.error).toContain("not valid JSON");
        expect(result.rawContent).toBe("not json at all");
      }
    });

    it("returns error for JSON array", () => {
      const result = parseGrowthOpportunityResponse("[1, 2, 3]");
      expect(isGrowthOpportunityError(result)).toBe(true);
      if (isGrowthOpportunityError(result)) {
        expect(result.error).toContain("not a JSON object");
      }
    });

    it("returns error for missing opportunities array", () => {
      const result = parseGrowthOpportunityResponse('{"foo": "bar"}');
      expect(isGrowthOpportunityError(result)).toBe(true);
      if (isGrowthOpportunityError(result)) {
        expect(result.error).toContain("opportunities");
      }
    });

    it("returns error for non-array opportunities", () => {
      const result = parseGrowthOpportunityResponse(
        '{"opportunities": "not array"}',
      );
      expect(isGrowthOpportunityError(result)).toBe(true);
    });

    it("returns error for invalid commentId", () => {
      const json = JSON.stringify({
        opportunities: [
          {
            commentId: "not-a-number",
            commentType: "review_comment",
            suggestion: "Go deeper",
          },
        ],
      });
      const result = parseGrowthOpportunityResponse(json);
      expect(isGrowthOpportunityError(result)).toBe(true);
      if (isGrowthOpportunityError(result)) {
        expect(result.error).toContain("commentId");
      }
    });

    it("returns error for invalid commentType", () => {
      const json = JSON.stringify({
        opportunities: [
          {
            commentId: 10,
            commentType: "unknown_type",
            suggestion: "Go deeper",
          },
        ],
      });
      const result = parseGrowthOpportunityResponse(json);
      expect(isGrowthOpportunityError(result)).toBe(true);
      if (isGrowthOpportunityError(result)) {
        expect(result.error).toContain("commentType");
      }
    });

    it("returns error for empty suggestion", () => {
      const json = JSON.stringify({
        opportunities: [
          {
            commentId: 10,
            commentType: "review_comment",
            suggestion: "",
          },
        ],
      });
      const result = parseGrowthOpportunityResponse(json);
      expect(isGrowthOpportunityError(result)).toBe(true);
      if (isGrowthOpportunityError(result)) {
        expect(result.error).toContain("suggestion");
      }
    });

    it("returns error for missing suggestion", () => {
      const json = JSON.stringify({
        opportunities: [{ commentId: 10, commentType: "review_comment" }],
      });
      const result = parseGrowthOpportunityResponse(json);
      expect(isGrowthOpportunityError(result)).toBe(true);
    });

    it("returns error for null item in opportunities array", () => {
      const json = JSON.stringify({ opportunities: [null] });
      const result = parseGrowthOpportunityResponse(json);
      expect(isGrowthOpportunityError(result)).toBe(true);
      if (isGrowthOpportunityError(result)) {
        expect(result.error).toContain("not an object");
      }
    });

    it("returns error for empty string", () => {
      const result = parseGrowthOpportunityResponse("");
      expect(isGrowthOpportunityError(result)).toBe(true);
    });
  });
});

describe("isGrowthOpportunityError", () => {
  it("returns true for GrowthOpportunityParseError", () => {
    expect(
      isGrowthOpportunityError({ error: "bad", rawContent: "x" }),
    ).toBe(true);
  });

  it("returns false for GrowthOpportunityResult", () => {
    expect(
      isGrowthOpportunityError({
        opportunities: [
          {
            commentId: 10,
            commentType: "review_comment",
            suggestion: "Go deeper on null checks",
          },
        ],
      }),
    ).toBe(false);
  });
});
