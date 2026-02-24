"use client";

// US-015: PRs opened per team member — bar chart + weekly trend
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
  LineChart,
  Line,
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
  author: string;
  count: number;
}

interface WeekData {
  week: string;
  count: number;
}

export function PrsOpenedCard() {
  const { period } = usePeriod();
  const colorMap = useTeamColors();
  const [byMember, setByMember] = useState<MemberData[]>([]);
  const [byWeek, setByWeek] = useState<WeekData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback((startDate: string, endDate: string) => {
    const id = ++fetchIdRef.current;
    const params = new URLSearchParams({ startDate, endDate });

    fetch(`/api/dashboard/prs-opened?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (id !== fetchIdRef.current) return; // stale
        setByMember(data.byMember ?? []);
        setByWeek(data.byWeek ?? []);
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
          <CardTitle>PRs Opened per Team Member</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" data-testid="prs-opened-skeleton" />
        </CardContent>
      </Card>
    );
  }

  const totalPRs = byMember.reduce((sum, m) => sum + m.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>PRs Opened per Team Member</CardTitle>
        <CardDescription>
          {totalPRs} PR{totalPRs !== 1 ? "s" : ""} opened during {period.label}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {byMember.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No opened PRs found for the selected period. Make sure you have team
            members configured and have synced your GitHub data.
          </p>
        ) : (
          <>
            {/* Bar chart: PRs per member */}
            <div>
              <h3 className="text-sm font-medium mb-4">By team member</h3>
              <ResponsiveContainer width="100%" height={Math.max(200, byMember.length * 50)}>
                <BarChart
                  data={byMember}
                  layout="vertical"
                  margin={{ left: 20, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="author" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" name="PRs" radius={[0, 4, 4, 0]}>
                    {byMember.map((entry) => (
                      <Cell key={entry.author} fill={colorMap[entry.author] ?? "var(--primary)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly trend */}
            {byWeek.length > 1 && (
              <div className="text-primary">
                <h3 className="text-sm font-medium mb-4 text-foreground">Weekly trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={byWeek} margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="PRs"
                      stroke="currentColor"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
