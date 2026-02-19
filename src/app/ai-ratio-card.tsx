"use client";

// US-021: AI vs Human authorship ratio — stacked bar chart + team aggregate
import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriod } from "./dashboard-context";

interface RawRow {
  author: string;
  aiGenerated: string;
  count: number;
}

interface TotalRow {
  aiGenerated: string;
  count: number;
}

interface ChartRow {
  author: string;
  human: number;
  ai: number;
  mixed: number;
  total: number;
}

const COLORS = {
  human: "hsl(142 71% 45%)", // green
  ai: "hsl(262 83% 58%)", // violet
  mixed: "hsl(32 95% 44%)", // orange
};

function buildChartData(raw: RawRow[]): ChartRow[] {
  const map = new Map<string, ChartRow>();

  for (const row of raw) {
    let entry = map.get(row.author);
    if (!entry) {
      entry = { author: row.author, human: 0, ai: 0, mixed: 0, total: 0 };
      map.set(row.author, entry);
    }
    const key = row.aiGenerated as keyof typeof COLORS;
    if (key in entry) {
      entry[key] = row.count;
    }
    entry.total += row.count;
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function AiRatioCard() {
  const { period } = usePeriod();
  const [byMember, setByMember] = useState<RawRow[]>([]);
  const [teamTotal, setTeamTotal] = useState<TotalRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback((startDate: string, endDate: string) => {
    const id = ++fetchIdRef.current;
    const params = new URLSearchParams({ startDate, endDate });

    fetch(`/api/dashboard/ai-ratio?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (id !== fetchIdRef.current) return;
        setByMember(json.byMember ?? []);
        setTeamTotal(json.teamTotal ?? []);
        setIsLoading(false);
      })
      .catch(() => {
        if (id !== fetchIdRef.current) return;
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData(period.startDate, period.endDate);
  }, [period.startDate, period.endDate, fetchData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI vs Human Authorship</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" data-testid="ai-ratio-skeleton" />
        </CardContent>
      </Card>
    );
  }

  const chartData = buildChartData(byMember);
  const totalPRs = teamTotal.reduce((sum, t) => sum + t.count, 0);
  const aiCount = teamTotal.find((t) => t.aiGenerated === "ai")?.count ?? 0;
  const humanCount = teamTotal.find((t) => t.aiGenerated === "human")?.count ?? 0;
  const mixedCount = teamTotal.find((t) => t.aiGenerated === "mixed")?.count ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI vs Human Authorship</CardTitle>
        <CardDescription>
          {totalPRs} PR{totalPRs !== 1 ? "s" : ""} — {humanCount} human,{" "}
          {aiCount} AI, {mixedCount} mixed during {period.label}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No PRs found for the selected period. Make sure you have team
            members configured and have synced your GitHub data.
          </p>
        ) : (
          <>
            {/* Stacked bar chart per member */}
            <div>
              <h3 className="text-sm font-medium mb-4">By team member</h3>
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
                  <YAxis dataKey="author" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="human"
                    name="Human"
                    stackId="a"
                    fill={COLORS.human}
                  />
                  <Bar
                    dataKey="ai"
                    name="AI"
                    stackId="a"
                    fill={COLORS.ai}
                  />
                  <Bar
                    dataKey="mixed"
                    name="Mixed"
                    stackId="a"
                    fill={COLORS.mixed}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Team aggregate */}
            <div>
              <h3 className="text-sm font-medium mb-4">Team aggregate</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: COLORS.human }}
                  />
                  <span className="text-sm">
                    Human: {humanCount} (
                    {totalPRs > 0
                      ? ((humanCount / totalPRs) * 100).toFixed(0)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: COLORS.ai }}
                  />
                  <span className="text-sm">
                    AI: {aiCount} (
                    {totalPRs > 0
                      ? ((aiCount / totalPRs) * 100).toFixed(0)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: COLORS.mixed }}
                  />
                  <span className="text-sm">
                    Mixed: {mixedCount} (
                    {totalPRs > 0
                      ? ((mixedCount / totalPRs) * 100).toFixed(0)
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
