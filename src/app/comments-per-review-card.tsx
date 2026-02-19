"use client";

// US-018: Comments per review per team member — bar chart + table
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
import { useTeamColors } from "./team-colors-context";

interface MemberData {
  reviewer: string;
  totalComments: number;
  prsReviewed: number;
  avg: number;
}

export function CommentsPerReviewCard() {
  const { period } = usePeriod();
  const colorMap = useTeamColors();
  const [data, setData] = useState<MemberData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback((startDate: string, endDate: string) => {
    const id = ++fetchIdRef.current;
    const params = new URLSearchParams({ startDate, endDate });

    fetch(`/api/dashboard/comments-per-review?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (id !== fetchIdRef.current) return;
        setData(json.data ?? []);
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
          <CardTitle>Comments per Review</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" data-testid="comments-review-skeleton" />
        </CardContent>
      </Card>
    );
  }

  const totalComments = data.reduce((sum, m) => sum + m.totalComments, 0);
  const totalPRs = data.reduce((sum, m) => sum + m.prsReviewed, 0);
  const teamAvg = totalPRs > 0 ? (totalComments / totalPRs).toFixed(1) : "0";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments per Review</CardTitle>
        <CardDescription>
          {totalComments} comment{totalComments !== 1 ? "s" : ""} across{" "}
          {totalPRs} PR{totalPRs !== 1 ? "s" : ""} reviewed — team avg{" "}
          {teamAvg} comments/review during {period.label}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No review comments found for the selected period. Make sure you
            have team members configured and have synced your GitHub data.
          </p>
        ) : (
          <>
            {/* Bar chart: avg comments per review per member */}
            <div>
              <h3 className="text-sm font-medium mb-4">
                Average comments per review
              </h3>
              <ResponsiveContainer
                width="100%"
                height={Math.max(200, data.length * 50)}
              >
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ left: 20, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="reviewer" type="category" width={120} />
                  <Tooltip
                    formatter={(value) => [
                      Number(value).toFixed(1),
                      "Avg comments",
                    ]}
                  />
                  <Bar
                    dataKey="avg"
                    name="Avg comments/review"
                    radius={[0, 4, 4, 0]}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.reviewer} fill={colorMap[entry.reviewer] ?? "hsl(var(--primary))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detail table */}
            <div>
              <h3 className="text-sm font-medium mb-4">Detail</h3>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Reviewer</th>
                      <th className="text-right p-3 font-medium">Comments</th>
                      <th className="text-right p-3 font-medium">
                        PRs Reviewed
                      </th>
                      <th className="text-right p-3 font-medium">
                        Avg / Review
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row) => (
                      <tr key={row.reviewer} className="border-b last:border-0">
                        <td className="p-3 font-medium">{row.reviewer}</td>
                        <td className="p-3 text-right">{row.totalComments}</td>
                        <td className="p-3 text-right">{row.prsReviewed}</td>
                        <td className="p-3 text-right">
                          {row.avg.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
