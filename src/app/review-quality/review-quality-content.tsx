// US-2.07 / US-2.08: Review Quality page orchestrator — state management and data fetching
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryBar } from "./summary-bar";
import { FilterBar } from "./filter-bar";
import { CommentsTable, type ClassifiedComment } from "./comments-table";
import { CommentDetailSheet } from "./comment-detail-sheet";
import { CategoryDonutChart } from "./category-donut-chart";
import { CategoryPerPersonChart } from "./category-per-person-chart";
import { CategoryTrendChart } from "./category-trend-chart";
import { ClassificationRunHistory } from "./classification-run-history";
import { MonthNavigator } from "./month-navigator";
import { getMonthStart, getMonthEnd } from "@/lib/date-periods";

interface CategoryDistribution {
  category: string;
  count: number;
}

interface SummaryData {
  classified: CategoryDistribution[];
  unclassifiedCount: number;
}

// US-2.08: Chart data types
interface ReviewerCategoryData {
  reviewer: string;
  category: string;
  count: number;
}

interface WeekCategoryTrend {
  week: string;
  category: string;
  count: number;
}

interface ChartData {
  teamDistribution: CategoryDistribution[];
  perReviewer: ReviewerCategoryData[];
  weeklyTrend: WeekCategoryTrend[];
}

interface TeamMember {
  githubUsername: string;
  displayName: string;
}

interface Filters {
  category: string;
  reviewer: string;
  dateStart: string;
  dateEnd: string;
  minConfidence: string;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getInitialMonth(): Date {
  return new Date();
}

function getFiltersForMonth(month: Date, base?: Filters): Filters {
  return {
    ...(base ?? { category: "all", reviewer: "all", minConfidence: "" }),
    dateStart: toDateString(getMonthStart(month)),
    dateEnd: toDateString(getMonthEnd(month)),
  };
}

const INITIAL_MONTH = getInitialMonth();

const DEFAULT_FILTERS: Filters = getFiltersForMonth(INITIAL_MONTH);

const DEFAULT_CHART_DATA: ChartData = {
  teamDistribution: [],
  perReviewer: [],
  weeklyTrend: [],
};

async function fetchCommentsFromApi(
  filters: Filters,
  sortBy: string,
  sortOrder: string,
): Promise<ClassifiedComment[]> {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== "all")
    params.set("category", filters.category);
  if (filters.reviewer && filters.reviewer !== "all")
    params.set("reviewer", filters.reviewer);
  if (filters.dateStart) params.set("dateStart", filters.dateStart);
  if (filters.dateEnd) params.set("dateEnd", filters.dateEnd);
  if (filters.minConfidence)
    params.set("minConfidence", filters.minConfidence);
  params.set("sortBy", sortBy);
  params.set("sortOrder", sortOrder);

  const res = await fetch(`/api/review-quality/comments?${params}`);
  const data = await res.json();
  return data.comments ?? [];
}

async function fetchSummaryFromApi(): Promise<SummaryData> {
  const res = await fetch("/api/review-quality/summary");
  return res.json();
}

async function fetchTeamMembersFromApi(): Promise<TeamMember[]> {
  const res = await fetch("/api/team");
  const data = await res.json();
  return data.members ?? [];
}

async function fetchRepoUrlFromApi(): Promise<string | null> {
  const res = await fetch("/api/settings/github-repo");
  const data = await res.json();
  if (data.owner && data.repo) {
    return `https://github.com/${data.owner}/${data.repo}`;
  }
  return null;
}

// US-2.08: Fetch charts data (date + reviewer filters only)
async function fetchChartsFromApi(filters: Filters): Promise<ChartData> {
  const params = new URLSearchParams();
  if (filters.reviewer && filters.reviewer !== "all")
    params.set("reviewer", filters.reviewer);
  if (filters.dateStart) params.set("dateStart", filters.dateStart);
  if (filters.dateEnd) params.set("dateEnd", filters.dateEnd);

  const res = await fetch(`/api/review-quality/charts?${params}`);
  return res.json();
}

export function ReviewQualityContent() {
  const [comments, setComments] = useState<ClassifiedComment[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    classified: [],
    unclassifiedCount: 0,
  });
  const [chartData, setChartData] = useState<ChartData>(DEFAULT_CHART_DATA);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<"date" | "confidence" | "category">(
    "date",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedComment, setSelectedComment] =
    useState<ClassifiedComment | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(INITIAL_MONTH);
  const [isLoading, setIsLoading] = useState(true);
  const initRef = useRef(false);

  // Reload comments whenever filters or sort change (after initial load)
  const reloadComments = useCallback(
    async (f: Filters, sb: string, so: string) => {
      try {
        const data = await fetchCommentsFromApi(f, sb, so);
        setComments(data);
      } catch {
        // Silently fail
      }
    },
    [],
  );

  // US-2.08: Reload charts when filters change
  const reloadCharts = useCallback(async (f: Filters) => {
    try {
      const data = await fetchChartsFromApi(f);
      setChartData(data);
    } catch {
      // Silently fail
    }
  }, []);

  // Initial load — runs once
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      try {
        const [commentsData, summaryData, teamData, url, charts] =
          await Promise.all([
            fetchCommentsFromApi(DEFAULT_FILTERS, "date", "desc"),
            fetchSummaryFromApi(),
            fetchTeamMembersFromApi(),
            fetchRepoUrlFromApi(),
            fetchChartsFromApi(DEFAULT_FILTERS),
          ]);
        setComments(commentsData);
        setSummary(summaryData);
        setTeamMembers(teamData);
        setRepoUrl(url);
        setChartData(charts);
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  function handleFiltersChange(newFilters: Filters) {
    setFilters(newFilters);
    reloadComments(newFilters, sortBy, sortOrder);
    reloadCharts(newFilters);
  }

  function handleMonthChange(month: Date) {
    setCurrentMonth(month);
    const newFilters = getFiltersForMonth(month, filters);
    handleFiltersChange(newFilters);
  }

  // US-2.16: Reclassify a comment manually
  async function handleReclassify(
    commentType: "review_comment" | "pr_comment",
    commentId: number,
    category: string,
  ) {
    try {
      const res = await fetch(
        `/api/review-quality/comments/${commentType}/${commentId}/classify`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category }),
        },
      );
      if (!res.ok) return;

      // Reload both comments and summary to reflect changes everywhere
      const [commentsData, summaryData] = await Promise.all([
        fetchCommentsFromApi(filters, sortBy, sortOrder),
        fetchSummaryFromApi(),
      ]);
      setComments(commentsData);
      setSummary(summaryData);

      // Update selected comment if it's the one being reclassified
      if (
        selectedComment &&
        selectedComment.commentType === commentType &&
        selectedComment.commentId === commentId
      ) {
        const updated = commentsData.find(
          (c) => c.commentType === commentType && c.commentId === commentId,
        );
        setSelectedComment(updated ?? null);
      }
    } catch {
      // Silently fail
    }
  }

  function handleSortChange(key: "date" | "confidence" | "category") {
    const newSortBy = key;
    let newSortOrder: "asc" | "desc" = "desc";
    if (sortBy === key) {
      newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    }
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    reloadComments(filters, newSortBy, newSortOrder);
  }

  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight mb-6">
        Review Quality
      </h1>

      {/* Summary bar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
          <CardDescription>
            Overview of how review comments are categorized across the team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <SummaryBar
              classified={summary.classified}
              unclassifiedCount={summary.unclassifiedCount}
            />
          )}
        </CardContent>
      </Card>

      {/* US-2.08: Charts dashboard */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Category Charts</CardTitle>
          <CardDescription>
            Interactive distribution and trend charts for comment categories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {isLoading ? (
            <Skeleton
              className="h-[300px] w-full"
              data-testid="charts-skeleton"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-medium mb-4">
                    Team-wide breakdown
                  </h3>
                  <CategoryDonutChart data={chartData.teamDistribution} />
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-4">
                    Per-person breakdown
                  </h3>
                  <CategoryPerPersonChart data={chartData.perReviewer} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-4">
                  Category trend over time
                </h3>
                <CategoryTrendChart data={chartData.weeklyTrend} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterBar
            filters={filters}
            onChange={handleFiltersChange}
            teamMembers={teamMembers}
          />
        </CardContent>
      </Card>

      {/* Comments table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Classified Comments</CardTitle>
              <CardDescription>
                Click a row to view full details. Sort by clicking column headers.
              </CardDescription>
            </div>
            <MonthNavigator
              currentMonth={currentMonth}
              onMonthChange={handleMonthChange}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <CommentsTable
              comments={comments}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              onSelect={setSelectedComment}
              onReclassify={handleReclassify}
              repoUrl={repoUrl}
            />
          )}
        </CardContent>
      </Card>

      {/* US-2.15: Classification Run History */}
      <Card className="mt-6" id="classification-history">
        <CardHeader>
          <CardTitle>Classification Run History</CardTitle>
          <CardDescription>
            History of all comment classification runs with status, duration, and error details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClassificationRunHistory />
        </CardContent>
      </Card>

      {/* Detail sheet */}
      <CommentDetailSheet
        comment={selectedComment}
        onClose={() => setSelectedComment(null)}
        onReclassify={handleReclassify}
        repoUrl={repoUrl}
      />
    </>
  );
}
