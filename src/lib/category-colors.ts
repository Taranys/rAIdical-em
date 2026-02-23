// US-2.07: Category display configuration — colors and labels for each classification category
import type { CommentCategory } from "@/lib/llm/classifier";

export const CATEGORY_CONFIG: Record<
  CommentCategory,
  { bg: string; text: string; label: string }
> = {
  bug_correctness: {
    bg: "bg-red-100",
    text: "text-red-800",
    label: "Bug / Correctness",
  },
  security: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    label: "Security",
  },
  performance: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    label: "Performance",
  },
  readability_maintainability: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    label: "Readability",
  },
  nitpick_style: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    label: "Nitpick / Style",
  },
  architecture_design: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    label: "Architecture",
  },
  missing_test_coverage: {
    bg: "bg-green-100",
    text: "text-green-800",
    label: "Missing Tests",
  },
  question_clarification: {
    bg: "bg-cyan-100",
    text: "text-cyan-800",
    label: "Question",
  },
};
