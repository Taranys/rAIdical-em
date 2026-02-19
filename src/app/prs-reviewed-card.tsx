"use client";

// US-017: PRs reviewed per team member — horizontal bar chart + table
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriod } from "./dashboard-context";

interface MemberReviewData {
  reviewer: string;
  count: number;
}

export function PrsReviewedCard() {
  const { period } = usePeriod();
  const [byMember, setByMember] = useState<MemberReviewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback((startDate: string, endDate: string) => {
    const id = ++fetchIdRef.current;
    const params = new URLSearchParams({ startDate, endDate });

    fetch(`/api/dashboard/prs-reviewed?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (id !== fetchIdRef.current) return;
        setByMember(data.byMember ?? []);
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
          <CardTitle>PRs Reviewed per Team Member</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" data-testid="prs-reviewed-skeleton" />
        </CardContent>
      </Card>
    );
  }

  const totalReviewed = byMember.reduce((sum, m) => sum + m.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>PRs Reviewed per Team Member</CardTitle>
        <CardDescription>
          {totalReviewed} PR{totalReviewed !== 1 ? "s" : ""} reviewed during{" "}
          {period.label}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {byMember.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reviews found for the selected period.
          </p>
        ) : (
          <>
            <div>
              <h3 className="text-sm font-medium mb-4">
                By team member (most active first)
              </h3>
              <ResponsiveContainer
                width="100%"
                height={Math.max(200, byMember.length * 50)}
              >
                <BarChart
                  data={byMember}
                  layout="vertical"
                  margin={{ left: 20, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="reviewer" type="category" width={120} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    name="PRs reviewed"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead className="text-right">PRs Reviewed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byMember.map((member, idx) => (
                  <TableRow key={member.reviewer}>
                    <TableCell className="text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {member.reviewer}
                    </TableCell>
                    <TableCell className="text-right">{member.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
