// US-2.08: Per-person category breakdown — stacked horizontal bar chart
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CATEGORY_CONFIG } from "@/lib/category-colors";
import { COMMENT_CATEGORIES } from "@/lib/llm/classifier";
import type { CommentCategory } from "@/lib/llm/classifier";

interface ReviewerCategoryData {
  reviewer: string;
  category: string;
  count: number;
}

interface CategoryPerPersonChartProps {
  data: ReviewerCategoryData[];
}

interface ChartRow {
  reviewer: string;
  [category: string]: string | number;
}

function buildChartData(data: ReviewerCategoryData[]): ChartRow[] {
  const map = new Map<string, ChartRow>();

  for (const d of data) {
    let row = map.get(d.reviewer);
    if (!row) {
      row = { reviewer: d.reviewer };
      map.set(d.reviewer, row);
    }
    row[d.category] = ((row[d.category] as number) ?? 0) + d.count;
  }

  return Array.from(map.values());
}

export function CategoryPerPersonChart({ data }: CategoryPerPersonChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No per-person data to display.
      </p>
    );
  }

  const chartData = buildChartData(data);
  // Only include categories that appear in the data
  const presentCategories = COMMENT_CATEGORIES.filter((cat) =>
    data.some((d) => d.category === cat),
  );

  return (
    <ResponsiveContainer
      width="100%"
      height={Math.max(200, chartData.length * 50)}
    >
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 20, right: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} />
        <YAxis dataKey="reviewer" type="category" width={120} />
        <Tooltip />
        <Legend />
        {presentCategories.map((cat, idx) => {
          const config = CATEGORY_CONFIG[cat as CommentCategory];
          return (
            <Bar
              key={cat}
              dataKey={cat}
              name={config?.label ?? cat}
              stackId="a"
              fill={config?.chartColor ?? "hsl(220 9% 46%)"}
              radius={
                idx === presentCategories.length - 1 ? [0, 4, 4, 0] : undefined
              }
            />
          );
        })}
      </BarChart>
    </ResponsiveContainer>
  );
}
