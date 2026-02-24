// US-2.07: Category display configuration — colors and labels for each classification category
// US-2.08: Added chartColor (hsl) for Recharts consumption
import type { CommentCategory } from "@/lib/llm/classifier";

export const CATEGORY_CONFIG: Record<
  CommentCategory,
  { bg: string; text: string; label: string; chartColor: string }
> = {
  bug_correctness: {
    bg: "bg-red-100",
    text: "text-red-800",
    label: "Bug / Correctness",
    chartColor: "hsl(0 84% 60%)",
  },
  security: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    label: "Security",
    chartColor: "hsl(25 95% 53%)",
  },
  performance: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    label: "Performance",
    chartColor: "hsl(45 93% 47%)",
  },
  readability_maintainability: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    label: "Readability",
    chartColor: "hsl(217 91% 60%)",
  },
  nitpick_style: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    label: "Nitpick / Style",
    chartColor: "hsl(220 9% 46%)",
  },
  architecture_design: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    label: "Architecture",
    chartColor: "hsl(271 76% 53%)",
  },
  missing_test_coverage: {
    bg: "bg-green-100",
    text: "text-green-800",
    label: "Missing Tests",
    chartColor: "hsl(142 71% 45%)",
  },
  question_clarification: {
    bg: "bg-cyan-100",
    text: "text-cyan-800",
    label: "Question",
    chartColor: "hsl(189 94% 43%)",
  },
};
