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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryBar } from "./summary-bar";
import { FilterBar, type Filters } from "./filter-bar";
import { CommentsTable, type ClassifiedComment } from "./comments-table";
import { CommentDetailSheet } from "./comment-detail-sheet";
import { CategoryDonutChart } from "./category-donut-chart";
import { CategoryPerPersonChart } from "./category-per-person-chart";
import { CategoryTrendChart } from "./category-trend-chart";
import { ClassificationRunHistory } from "./classification-run-history";
import {
  getDateRangeForPreset,
  type PeriodPreset,
} from "@/lib/date-periods";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

// Date range params derived from period preset, used for API calls
interface DateRangeParams {
  dateStart: string;
  dateEnd: string;
}

const PAGE_SIZE = 20;

const DEFAULT_PERIOD: PeriodPreset = "this-month";

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getDateParamsForPreset(preset: PeriodPreset): DateRangeParams {
  const range = getDateRangeForPreset(preset);
  return {
    dateStart: toDateString(new Date(range.startDate)),
    dateEnd: toDateString(new Date(range.endDate)),
  };
}

const DEFAULT_FILTERS: Filters = {
  category: "all",
  reviewer: "all",
  minConfidence: "",
};

const DEFAULT_CHART_DATA: ChartData = {
  teamDistribution: [],
  perReviewer: [],
  weeklyTrend: [],
};

interface CommentsResponse {
  comments: ClassifiedComment[];
  totalCount: number;
  page: number;
  pageSize: number;
}

async function fetchCommentsFromApi(
  filters: Filters,
  dateParams: DateRangeParams,
  sortBy: string,
  sortOrder: string,
  page: number = 1,
): Promise<CommentsResponse> {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== "all")
    params.set("category", filters.category);
  if (filters.reviewer && filters.reviewer !== "all")
    params.set("reviewer", filters.reviewer);
  if (dateParams.dateStart) params.set("dateStart", dateParams.dateStart);
  if (dateParams.dateEnd) params.set("dateEnd", dateParams.dateEnd);
  if (filters.minConfidence)
    params.set("minConfidence", filters.minConfidence);
  params.set("sortBy", sortBy);
  params.set("sortOrder", sortOrder);
  params.set("page", String(page));
  params.set("pageSize", String(PAGE_SIZE));

  const res = await fetch(`/api/review-quality/comments?${params}`);
  const data = await res.json();
  return {
    comments: data.comments ?? [],
    totalCount: data.totalCount ?? 0,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? PAGE_SIZE,
  };
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
async function fetchChartsFromApi(
  filters: Filters,
  dateParams: DateRangeParams,
): Promise<ChartData> {
  const params = new URLSearchParams();
  if (filters.reviewer && filters.reviewer !== "all")
    params.set("reviewer", filters.reviewer);
  if (dateParams.dateStart) params.set("dateStart", dateParams.dateStart);
  if (dateParams.dateEnd) params.set("dateEnd", dateParams.dateEnd);

  const res = await fetch(`/api/review-quality/charts?${params}`);
  return res.json();
}

export function ReviewQualityContent() {
  const [comments, setComments] = useState<ClassifiedComment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [summary, setSummary] = useState<SummaryData>({
    classified: [],
    unclassifiedCount: 0,
  });
  const [chartData, setChartData] = useState<ChartData>(DEFAULT_CHART_DATA);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [periodPreset, setPeriodPreset] =
    useState<PeriodPreset>(DEFAULT_PERIOD);
  const [sortBy, setSortBy] = useState<"date" | "confidence" | "category">(
    "date",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedComment, setSelectedComment] =
    useState<ClassifiedComment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initRef = useRef(false);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const dateParams = getDateParamsForPreset(periodPreset);

  // Reload comments whenever filters, sort, or page change (after initial load)
  const reloadComments = useCallback(
    async (
      f: Filters,
      dp: DateRangeParams,
      sb: string,
      so: string,
      page: number,
    ) => {
      try {
        const data = await fetchCommentsFromApi(f, dp, sb, so, page);
        setComments(data.comments);
        setTotalCount(data.totalCount);
        setCurrentPage(data.page);
      } catch {
        // Silently fail
      }
    },
    [],
  );

  // US-2.08: Reload charts when filters change
  const reloadCharts = useCallback(
    async (f: Filters, dp: DateRangeParams) => {
      try {
        const data = await fetchChartsFromApi(f, dp);
        setChartData(data);
      } catch {
        // Silently fail
      }
    },
    [],
  );

  // Initial load — runs once
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initialDateParams = getDateParamsForPreset(DEFAULT_PERIOD);

    async function init() {
      try {
        const [commentsData, summaryData, teamData, url, charts] =
          await Promise.all([
            fetchCommentsFromApi(
              DEFAULT_FILTERS,
              initialDateParams,
              "date",
              "desc",
              1,
            ),
            fetchSummaryFromApi(),
            fetchTeamMembersFromApi(),
            fetchRepoUrlFromApi(),
            fetchChartsFromApi(DEFAULT_FILTERS, initialDateParams),
          ]);
        setComments(commentsData.comments);
        setTotalCount(commentsData.totalCount);
        setCurrentPage(commentsData.page);
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
    setCurrentPage(1);
    reloadComments(newFilters, dateParams, sortBy, sortOrder, 1);
    reloadCharts(newFilters, dateParams);
  }

  function handlePeriodChange(preset: PeriodPreset) {
    setPeriodPreset(preset);
    const newDateParams = getDateParamsForPreset(preset);
    setCurrentPage(1);
    reloadComments(filters, newDateParams, sortBy, sortOrder, 1);
    reloadCharts(filters, newDateParams);
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
        fetchCommentsFromApi(filters, dateParams, sortBy, sortOrder, currentPage),
        fetchSummaryFromApi(),
      ]);
      setComments(commentsData.comments);
      setTotalCount(commentsData.totalCount);
      setSummary(summaryData);

      // Update selected comment if it's the one being reclassified
      if (
        selectedComment &&
        selectedComment.commentType === commentType &&
        selectedComment.commentId === commentId
      ) {
        const updated = commentsData.comments.find(
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
    setCurrentPage(1);
    reloadComments(filters, dateParams, newSortBy, newSortOrder, 1);
  }

  function handlePageChange(page: number) {
    setCurrentPage(page);
    reloadComments(filters, dateParams, sortBy, sortOrder, page);
  }

  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight mb-6">
        Review Quality
      </h1>

      {/* Filters — top of page for scope-first UX */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterBar
            filters={filters}
            onChange={handleFiltersChange}
            teamMembers={teamMembers}
            periodPreset={periodPreset}
            onPeriodChange={handlePeriodChange}
          />
        </CardContent>
      </Card>

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

      {/* Comments table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Classified Comments{!isLoading && ` (${totalCount})`}
          </CardTitle>
          <CardDescription>
            Click a row to view full details. Sort by clicking column headers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <>
              <CommentsTable
                comments={comments}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onSelect={setSelectedComment}
                onReclassify={handleReclassify}
                repoUrl={repoUrl}
              />
              {totalCount > 0 && (
                <div
                  className="flex items-center justify-center gap-4 mt-4"
                  data-testid="pagination-controls"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    data-testid="pagination-prev"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span
                    className="text-sm text-muted-foreground"
                    data-testid="pagination-indicator"
                  >
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    data-testid="pagination-next"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
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
