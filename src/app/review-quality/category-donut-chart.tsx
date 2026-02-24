// US-2.08: Team-wide category breakdown — donut chart
"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { CATEGORY_CONFIG } from "@/lib/category-colors";
import type { CommentCategory } from "@/lib/llm/classifier";

interface CategoryData {
  category: string;
  count: number;
}

interface CategoryDonutChartProps {
  data: CategoryData[];
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  payload: { category: string; count: number; label: string; fill: string };
}

function CustomTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  total: number;
}) {
  if (!active || !payload?.[0]) return null;
  const entry = payload[0];
  const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{entry.payload.label}</p>
      <p className="text-muted-foreground">
        {entry.value} ({pct}%)
      </p>
    </div>
  );
}

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No classified comments to display.
      </p>
    );
  }

  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => {
      const config = CATEGORY_CONFIG[d.category as CommentCategory];
      return {
        category: d.category,
        count: d.count,
        label: config?.label ?? d.category,
        fill: config?.chartColor ?? "hsl(220 9% 46%)",
      };
    });

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{total} comments</p>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
          >
            {chartData.map((entry) => (
              <Cell key={entry.category} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip total={total} />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
