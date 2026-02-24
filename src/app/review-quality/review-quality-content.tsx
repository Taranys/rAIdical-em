// US-2.07: Review Quality page orchestrator — state management and data fetching
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SummaryBar } from "./summary-bar";
import { FilterBar } from "./filter-bar";
import { CommentsTable, type ClassifiedComment } from "./comments-table";
import { CommentDetailSheet } from "./comment-detail-sheet";

interface CategoryDistribution {
  category: string;
  count: number;
}

interface SummaryData {
  classified: CategoryDistribution[];
  unclassifiedCount: number;
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

const DEFAULT_FILTERS: Filters = {
  category: "all",
  reviewer: "all",
  dateStart: "",
  dateEnd: "",
  minConfidence: "",
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

export function ReviewQualityContent() {
  const [comments, setComments] = useState<ClassifiedComment[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    classified: [],
    unclassifiedCount: 0,
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<"date" | "confidence" | "category">(
    "date",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedComment, setSelectedComment] =
    useState<ClassifiedComment | null>(null);
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

  // Initial load — runs once
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      try {
        const [commentsData, summaryData, teamData, url] = await Promise.all([
          fetchCommentsFromApi(DEFAULT_FILTERS, "date", "desc"),
          fetchSummaryFromApi(),
          fetchTeamMembersFromApi(),
          fetchRepoUrlFromApi(),
        ]);
        setComments(commentsData);
        setSummary(summaryData);
        setTeamMembers(teamData);
        setRepoUrl(url);
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
          <CardTitle>Classified Comments</CardTitle>
          <CardDescription>
            Click a row to view full details. Sort by clicking column headers.
          </CardDescription>
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
