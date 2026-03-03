// Server-only: dynamic category config from DB (not importable in Client Components)
import { getAllCategories } from "@/db/custom-categories";
import { CATEGORY_CONFIG, type CategoryDisplayConfig } from "./category-colors";
import type { CommentCategory } from "@/lib/llm/classifier";

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return `hsl(0 0% ${Math.round(l * 100)}%)`;

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return `hsl(${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}

// Dynamic config builder from custom categories (server-only)
export function getCategoryConfig(): Record<string, CategoryDisplayConfig> {
  const categories = getAllCategories();
  const config: Record<string, CategoryDisplayConfig> = {};

  for (const cat of categories) {
    const hardcoded = CATEGORY_CONFIG[cat.slug as CommentCategory];
    if (hardcoded) {
      config[cat.slug] = { ...hardcoded, label: cat.label };
    } else {
      config[cat.slug] = {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: cat.label,
        chartColor: hexToHsl(cat.color),
      };
    }
  }

  return config;
}
