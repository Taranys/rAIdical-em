// US-2.14: 1:1 Preparation page content — member selector + data panels
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PeriodProvider, usePeriod } from "@/app/dashboard-context";
import { PeriodSelector } from "@/app/period-selector";

interface TeamMember {
  id: number;
  githubUsername: string;
  displayName: string;
  avatarUrl: string | null;
  color: string;
}

interface Profile {
  dimensionName: string;
  dimensionFamily: string;
  maturityLevel: string;
}

interface EnrichedHighlight {
  id: number;
  reasoning: string;
  body: string | null;
  prTitle: string | null;
  prNumber: number | null;
}

interface WeeklyActivity {
  week: string;
  count: number;
}

interface MemberData {
  member: TeamMember;
  summary: {
    overallMaturity: string | null;
    depthScore: number;
    totalComments: number;
    topDimensions: { name: string; family: string; level: string }[];
    topCategories: { category: string; count: number }[];
  };
  profiles: Profile[];
  bestComments: EnrichedHighlight[];
  growthOpportunities: EnrichedHighlight[];
  weeklyActivity: WeeklyActivity[];
}

const MATURITY_COLORS: Record<string, string> = {
  senior: "bg-green-100 text-green-800",
  experienced: "bg-blue-100 text-blue-800",
  junior: "bg-orange-100 text-orange-800",
};

const CATEGORY_LABELS: Record<string, string> = {
  bug_correctness: "Bug / Correctness",
  security: "Security",
  performance: "Performance",
  architecture_design: "Architecture",
  missing_test_coverage: "Test Coverage",
  readability_maintainability: "Readability",
  question_clarification: "Questions",
  nitpick_style: "Nitpick / Style",
};

function OneOnOneInner() {
  const { period } = usePeriod();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const initRef = useRef(false);

  // Fetch team members list
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function fetchMembers() {
      try {
        const res = await fetch("/api/one-on-one");
        const data = await res.json();
        setMembers(data.members ?? []);
      } catch {
        // Silently fail
      } finally {
        setIsLoadingMembers(false);
      }
    }
    fetchMembers();
  }, []);

  // Fetch member data when selection or period changes
  useEffect(() => {
    if (!selectedMemberId) {
      setMemberData(null);
      return;
    }

    async function fetchMemberData() {
      setIsLoadingData(true);
      try {
        const params = new URLSearchParams({
          memberId: selectedMemberId,
          startDate: period.startDate,
          endDate: period.endDate,
        });
        const res = await fetch(`/api/one-on-one?${params}`);
        const data = await res.json();
        setMemberData(data);
      } catch {
        setMemberData(null);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchMemberData();
  }, [selectedMemberId, period.startDate, period.endDate]);

  return (
    <>
      <div className="flex items-center justify-between mb-6 print:mb-4">
        <h1 className="text-4xl font-bold tracking-tight print:text-2xl">
          1:1 Preparation
        </h1>
        <div className="flex items-center gap-4 print:hidden">
          <PeriodSelector />
        </div>
      </div>

      {/* Member Selector */}
      {isLoadingMembers ? (
        <Skeleton className="h-10 w-[280px] mb-6" />
      ) : members.length === 0 ? (
        <p className="text-muted-foreground">
          No team members found. Add members on the Team page first.
        </p>
      ) : (
        <div className="mb-6 print:hidden">
          <Select
            value={selectedMemberId}
            onValueChange={setSelectedMemberId}
          >
            <SelectTrigger className="w-[280px]" data-testid="member-selector">
              <SelectValue placeholder="Select a team member..." />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: m.color }}
                    />
                    {m.displayName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Loading state */}
      {isLoadingData && (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      )}

      {/* Member data */}
      {memberData && !isLoadingData && (
        <div className="space-y-6 print:space-y-4">
          {/* Print header */}
          <div className="hidden print:block">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-semibold">
                {memberData.member.displayName}
              </span>
              <span className="text-sm text-muted-foreground">
                @{memberData.member.githubUsername}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{period.label}</p>
          </div>

          {/* Summary Card */}
          <Card data-testid="summary-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={memberData.member.avatarUrl ?? undefined}
                    alt={memberData.member.displayName}
                  />
                  <AvatarFallback>
                    {memberData.member.displayName
                      .substring(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{memberData.member.displayName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    @{memberData.member.githubUsername}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Overall Maturity
                  </p>
                  <p className="text-lg font-semibold capitalize">
                    {memberData.summary.overallMaturity ? (
                      <Badge
                        className={
                          MATURITY_COLORS[
                            memberData.summary.overallMaturity
                          ] ?? ""
                        }
                      >
                        {memberData.summary.overallMaturity}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Review Depth Score
                  </p>
                  <p className="text-2xl font-bold">
                    {memberData.summary.depthScore}
                    <span className="text-sm text-muted-foreground font-normal">
                      /100
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Comments
                  </p>
                  <p className="text-2xl font-bold">
                    {memberData.summary.totalComments}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Top Dimensions
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {memberData.summary.topDimensions.length > 0 ? (
                      memberData.summary.topDimensions.map((d) => (
                        <Badge
                          key={d.name}
                          variant="outline"
                          className="text-xs capitalize"
                        >
                          {d.name.replace(/_/g, " ")}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Categories */}
              {memberData.summary.topCategories.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Top Review Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {memberData.summary.topCategories.map((c) => (
                      <Badge key={c.category} variant="secondary">
                        {CATEGORY_LABELS[c.category] ?? c.category} ({c.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Activity Sparkline */}
          {memberData.weeklyActivity.length > 0 && (
            <Card data-testid="activity-chart">
              <CardHeader>
                <CardTitle className="text-base">Review Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[120px] print:h-[80px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={memberData.weeklyActivity}>
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v: string) => v.split("-")[1] ?? v}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        allowDecimals={false}
                        width={30}
                      />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke={memberData.member.color}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator className="print:hidden" />

          {/* Best Comments */}
          <Card data-testid="best-comments">
            <CardHeader>
              <CardTitle className="text-base">
                Best Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {memberData.bestComments.length > 0 ? (
                <div className="space-y-4">
                  {memberData.bestComments.map((c) => (
                    <div
                      key={c.id}
                      className="border rounded-lg p-3 print:break-inside-avoid"
                    >
                      {c.prTitle && (
                        <p className="text-xs text-muted-foreground mb-1">
                          PR: {c.prTitle}
                        </p>
                      )}
                      {c.body && (
                        <p className="text-sm whitespace-pre-wrap mb-2 line-clamp-4 print:line-clamp-none">
                          {c.body}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground italic">
                        {c.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No best comments found. Run the highlight generation from the
                  Review Quality page to populate this section.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Growth Opportunities */}
          <Card data-testid="growth-opportunities">
            <CardHeader>
              <CardTitle className="text-base">
                Growth Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {memberData.growthOpportunities.length > 0 ? (
                <div className="space-y-4">
                  {memberData.growthOpportunities.map((c) => (
                    <div
                      key={c.id}
                      className="border rounded-lg p-3 print:break-inside-avoid"
                    >
                      {c.prTitle && (
                        <p className="text-xs text-muted-foreground mb-1">
                          PR: {c.prTitle}
                        </p>
                      )}
                      {c.body && (
                        <p className="text-sm whitespace-pre-wrap mb-2 line-clamp-4 print:line-clamp-none">
                          {c.body}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground italic">
                        {c.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No growth opportunities found. Run the highlight generation
                  from the Review Quality page to populate this section.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* No member selected state */}
      {!selectedMemberId && !isLoadingMembers && members.length > 0 && (
        <p className="text-muted-foreground mt-8 text-center print:hidden">
          Select a team member to view their 1:1 preparation data.
        </p>
      )}
    </>
  );
}

export function OneOnOneContent() {
  return (
    <PeriodProvider>
      <OneOnOneInner />
    </PeriodProvider>
  );
}
