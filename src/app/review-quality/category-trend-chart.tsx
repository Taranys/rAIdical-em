// US-2.08: Category trend over time — multi-line chart
"use client";

import {
  LineChart,
  Line,
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

interface WeekCategoryTrend {
  week: string;
  category: string;
  count: number;
}

interface CategoryTrendChartProps {
  data: WeekCategoryTrend[];
}

interface ChartRow {
  week: string;
  [category: string]: string | number;
}

function buildChartData(data: WeekCategoryTrend[]): ChartRow[] {
  const map = new Map<string, ChartRow>();

  for (const d of data) {
    let row = map.get(d.week);
    if (!row) {
      row = { week: d.week };
      map.set(d.week, row);
    }
    row[d.category] = ((row[d.category] as number) ?? 0) + d.count;
  }

  return Array.from(map.values()).sort((a, b) =>
    a.week.localeCompare(b.week),
  );
}

export function CategoryTrendChart({ data }: CategoryTrendChartProps) {
  const chartData = buildChartData(data);
  const uniqueWeeks = new Set(data.map((d) => d.week));

  if (uniqueWeeks.size < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Not enough data to show a trend. At least two weeks of classified
        comments are needed.
      </p>
    );
  }

  const presentCategories = COMMENT_CATEGORIES.filter((cat) =>
    data.some((d) => d.category === cat),
  );

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        {presentCategories.map((cat) => {
          const config = CATEGORY_CONFIG[cat as CommentCategory];
          return (
            <Line
              key={cat}
              type="monotone"
              dataKey={cat}
              name={config?.label ?? cat}
              stroke={config?.chartColor ?? "hsl(220 9% 46%)"}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}
