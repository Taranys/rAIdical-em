// US-2.10: Seniority competency dimensions configuration
import type { CommentCategory } from "@/lib/llm/classifier";

// --- Types ---

export interface SeniorityDimension {
  name: string;
  family: "technical" | "soft_skill";
  description: string;
}

export interface TechnicalCategoryDimension extends SeniorityDimension {
  family: "technical";
  /** Classification categories that map to this dimension */
  sourceCategories: CommentCategory[];
}

// --- Technical dimensions derived from classification categories ---

export const TECHNICAL_CATEGORY_DIMENSIONS: TechnicalCategoryDimension[] = [
  {
    name: "security",
    family: "technical",
    description:
      "Ability to detect security vulnerabilities, injection risks, and unsafe practices in code reviews",
    sourceCategories: ["security"],
  },
  {
    name: "architecture",
    family: "technical",
    description:
      "Understanding of design patterns, system structure, API contracts, and architectural trade-offs",
    sourceCategories: ["architecture_design"],
  },
  {
    name: "performance",
    family: "technical",
    description:
      "Ability to spot performance bottlenecks, inefficient algorithms, and optimization opportunities",
    sourceCategories: ["performance"],
  },
  {
    name: "testing",
    family: "technical",
    description:
      "Focus on test coverage, edge cases, test quality, and testing best practices",
    sourceCategories: ["missing_test_coverage"],
  },
];

// --- Soft skill dimensions inferred by LLM ---

export const SOFT_SKILL_DIMENSIONS: SeniorityDimension[] = [
  {
    name: "pedagogy",
    family: "soft_skill",
    description:
      "Quality of explanations in review comments — does the reviewer teach and explain the 'why', not just point out issues?",
  },
  {
    name: "cross_team_awareness",
    family: "soft_skill",
    description:
      "Understanding of global impacts and challenges beyond the reviewer's own team — awareness of cross-cutting concerns and other teams' constraints",
  },
  {
    name: "boldness",
    family: "soft_skill",
    description:
      "Willingness to challenge code and push back on decisions, even from senior or experienced authors — constructive courage in reviews",
  },
  {
    name: "thoroughness",
    family: "soft_skill",
    description:
      "Depth and consistency of reviews — does the reviewer systematically check edge cases, error handling, and completeness?",
  },
];

// --- File extension to language mapping ---

export const FILE_EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".py": "python",
  ".go": "go",
  ".rb": "ruby",
  ".java": "java",
  ".kt": "kotlin",
  ".rs": "rust",
  ".cs": "csharp",
  ".cpp": "cpp",
  ".c": "c",
  ".h": "c",
  ".hpp": "cpp",
  ".swift": "swift",
  ".php": "php",
  ".scala": "scala",
  ".sh": "shell",
  ".bash": "shell",
  ".zsh": "shell",
  ".css": "css",
  ".scss": "css",
  ".less": "css",
  ".html": "html",
  ".sql": "sql",
  ".yml": "yaml",
  ".yaml": "yaml",
  ".json": "json",
  ".xml": "xml",
  ".md": "markdown",
  ".ex": "elixir",
  ".exs": "elixir",
  ".erl": "erlang",
  ".dart": "dart",
  ".r": "r",
  ".R": "r",
  ".lua": "lua",
  ".zig": "zig",
};
