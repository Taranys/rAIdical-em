// Seniority competency dimensions — DB-backed accessor functions
import type { CommentCategory } from "@/lib/llm/classifier";
import {
  getEnabledDimensionConfigs,
  type DimensionConfig,
} from "@/db/seniority-dimension-configs";

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

// --- DB-backed accessor functions ---

function toTechnicalDimension(config: DimensionConfig): TechnicalCategoryDimension {
  return {
    name: config.name,
    family: "technical",
    description: config.description,
    sourceCategories: config.sourceCategories
      ? (JSON.parse(config.sourceCategories) as CommentCategory[])
      : [],
  };
}

function toSeniorityDimension(config: DimensionConfig): SeniorityDimension {
  return {
    name: config.name,
    family: config.family as "technical" | "soft_skill",
    description: config.description,
  };
}

type DbParam = Parameters<typeof getEnabledDimensionConfigs>[0];

export function getActiveTechnicalDimensions(
  dbInstance?: DbParam,
): TechnicalCategoryDimension[] {
  const enabled = getEnabledDimensionConfigs(dbInstance);
  return enabled
    .filter((d) => d.family === "technical")
    .map(toTechnicalDimension);
}

export function getActiveSoftSkillDimensions(
  dbInstance?: DbParam,
): SeniorityDimension[] {
  const enabled = getEnabledDimensionConfigs(dbInstance);
  return enabled
    .filter((d) => d.family === "soft_skill")
    .map(toSeniorityDimension);
}

export function getActiveDimensionNames(
  dbInstance?: DbParam,
): Set<string> {
  const enabled = getEnabledDimensionConfigs(dbInstance);
  return new Set(enabled.map((d) => d.name));
}

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
