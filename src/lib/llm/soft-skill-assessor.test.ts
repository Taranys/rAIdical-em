// US-2.10: Soft skill assessor prompt and parser tests
import { describe, it, expect } from "vitest";
import {
  buildSoftSkillPrompt,
  parseSoftSkillResponse,
  isSoftSkillError,
  type SoftSkillInput,
} from "./soft-skill-assessor";

const sampleInput: SoftSkillInput = {
  teamMemberName: "Alice",
  comments: [
    {
      body: "This function should handle the null case — if `user` is undefined, the downstream service will throw a 500.",
      category: "bug_correctness",
      filePath: "src/auth/login.ts",
      prTitle: "Add user login",
    },
    {
      body: "Nice refactor! But I think we should consider the impact on the billing team's integration.",
      category: "architecture_design",
      filePath: null,
      prTitle: "Refactor user service",
    },
  ],
  softSkills: [
    {
      name: "pedagogy",
      description: "Quality of explanations in review comments",
    },
    {
      name: "boldness",
      description: "Willingness to challenge code",
    },
  ],
};

describe("buildSoftSkillPrompt", () => {
  it("includes the team member name", () => {
    const prompt = buildSoftSkillPrompt(sampleInput);
    expect(prompt).toContain("Alice");
  });

  it("includes comment bodies", () => {
    const prompt = buildSoftSkillPrompt(sampleInput);
    expect(prompt).toContain("This function should handle the null case");
    expect(prompt).toContain("Nice refactor!");
  });

  it("includes soft skill names and descriptions", () => {
    const prompt = buildSoftSkillPrompt(sampleInput);
    expect(prompt).toContain("pedagogy");
    expect(prompt).toContain("Quality of explanations in review comments");
    expect(prompt).toContain("boldness");
    expect(prompt).toContain("Willingness to challenge code");
  });

  it("includes file path when available", () => {
    const prompt = buildSoftSkillPrompt(sampleInput);
    expect(prompt).toContain("src/auth/login.ts");
  });

  it("requests JSON output with scores per skill", () => {
    const prompt = buildSoftSkillPrompt(sampleInput);
    expect(prompt).toContain('"scores"');
    expect(prompt).toContain('"name"');
    expect(prompt).toContain('"score"');
    expect(prompt).toContain('"reasoning"');
  });
});

describe("parseSoftSkillResponse", () => {
  it("parses a valid response with scores", () => {
    const content = JSON.stringify({
      scores: [
        { name: "pedagogy", score: 75, reasoning: "Clear explanations" },
        { name: "boldness", score: 60, reasoning: "Shows some courage" },
      ],
    });

    const result = parseSoftSkillResponse(content);
    expect(isSoftSkillError(result)).toBe(false);
    if (!isSoftSkillError(result)) {
      expect(result.scores).toHaveLength(2);
      expect(result.scores[0]).toEqual({
        name: "pedagogy",
        score: 75,
        reasoning: "Clear explanations",
      });
    }
  });

  it("handles markdown-fenced JSON", () => {
    const content = "```json\n" + JSON.stringify({
      scores: [
        { name: "pedagogy", score: 80, reasoning: "Good" },
      ],
    }) + "\n```";

    const result = parseSoftSkillResponse(content);
    expect(isSoftSkillError(result)).toBe(false);
  });

  it("returns error for invalid JSON", () => {
    const result = parseSoftSkillResponse("not json at all");
    expect(isSoftSkillError(result)).toBe(true);
    if (isSoftSkillError(result)) {
      expect(result.error).toContain("not valid JSON");
    }
  });

  it("returns error for missing scores array", () => {
    const result = parseSoftSkillResponse(JSON.stringify({ data: [] }));
    expect(isSoftSkillError(result)).toBe(true);
    if (isSoftSkillError(result)) {
      expect(result.error).toContain("scores");
    }
  });

  it("returns error for invalid score value (out of range)", () => {
    const content = JSON.stringify({
      scores: [
        { name: "pedagogy", score: 150, reasoning: "Too high" },
      ],
    });
    const result = parseSoftSkillResponse(content);
    expect(isSoftSkillError(result)).toBe(true);
  });

  it("returns error for missing reasoning", () => {
    const content = JSON.stringify({
      scores: [
        { name: "pedagogy", score: 50, reasoning: "" },
      ],
    });
    const result = parseSoftSkillResponse(content);
    expect(isSoftSkillError(result)).toBe(true);
  });

  it("returns error for missing name", () => {
    const content = JSON.stringify({
      scores: [
        { score: 50, reasoning: "No name" },
      ],
    });
    const result = parseSoftSkillResponse(content);
    expect(isSoftSkillError(result)).toBe(true);
  });
});
