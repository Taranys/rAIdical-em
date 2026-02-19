"use client";

// US-016: PR size per team member — table with expandable rows
import { useCallback, useEffect, useRef, useState } from "react";
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
import { ChevronDown, ChevronRight } from "lucide-react";
import { usePeriod } from "./dashboard-context";

const LARGE_PR_THRESHOLD = 500;

interface MemberSize {
  author: string;
  avgAdditions: number;
  avgDeletions: number;
  prCount: number;
}

interface PRDetail {
  id: number;
  number: number;
  title: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  createdAt: string;
}

export function PrSizeCard() {
  const { period } = usePeriod();
  const [byMember, setByMember] = useState<MemberSize[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedAuthor, setExpandedAuthor] = useState<string | null>(null);
  const [authorPRs, setAuthorPRs] = useState<PRDetail[]>([]);
  const [isLoadingPRs, setIsLoadingPRs] = useState(false);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback((startDate: string, endDate: string) => {
    const id = ++fetchIdRef.current;
    const params = new URLSearchParams({ startDate, endDate });

    fetch(`/api/dashboard/pr-size?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (id !== fetchIdRef.current) return;
        setByMember(data.byMember ?? []);
        setExpandedAuthor(null);
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

  function toggleAuthor(author: string) {
    if (expandedAuthor === author) {
      setExpandedAuthor(null);
      setAuthorPRs([]);
      return;
    }

    setExpandedAuthor(author);
    setIsLoadingPRs(true);
    const params = new URLSearchParams({
      startDate: period.startDate,
      endDate: period.endDate,
    });

    fetch(`/api/dashboard/pr-size/${encodeURIComponent(author)}?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setAuthorPRs(data.prs ?? []);
      })
      .finally(() => setIsLoadingPRs(false));
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PR Size per Team Member</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" data-testid="pr-size-skeleton" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>PR Size per Team Member</CardTitle>
        <CardDescription>
          Average lines added/deleted per PR during {period.label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {byMember.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No PRs found for the selected period.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Avg Additions</TableHead>
                <TableHead className="text-right">Avg Deletions</TableHead>
                <TableHead className="text-right">Avg Total</TableHead>
                <TableHead className="text-right">PRs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byMember.map((member) => {
                const avgTotal = member.avgAdditions + member.avgDeletions;
                const isLarge = avgTotal > LARGE_PR_THRESHOLD;
                const isExpanded = expandedAuthor === member.author;

                return (
                  <>
                    <TableRow
                      key={member.author}
                      className={`cursor-pointer hover:bg-muted/50 ${isLarge ? "bg-red-50 dark:bg-red-950/30" : ""}`}
                      onClick={() => toggleAuthor(member.author)}
                      data-testid={`member-row-${member.author}`}
                    >
                      <TableCell>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {member.author}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        +{member.avgAdditions}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -{member.avgDeletions}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${isLarge ? "text-red-600" : ""}`}>
                        {avgTotal}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.prCount}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${member.author}-detail`}>
                        <TableCell colSpan={6} className="p-0">
                          <div className="bg-muted/30 px-8 py-3">
                            {isLoadingPRs ? (
                              <Skeleton className="h-[60px] w-full" />
                            ) : authorPRs.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No PRs found.</p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>PR</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead className="text-right">+Lines</TableHead>
                                    <TableHead className="text-right">-Lines</TableHead>
                                    <TableHead className="text-right">Files</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {authorPRs.map((pr) => (
                                    <TableRow key={pr.id}>
                                      <TableCell className="font-mono text-sm">
                                        #{pr.number}
                                      </TableCell>
                                      <TableCell className="max-w-[300px] truncate">
                                        {pr.title}
                                      </TableCell>
                                      <TableCell className="text-right text-green-600">
                                        +{pr.additions}
                                      </TableCell>
                                      <TableCell className="text-right text-red-600">
                                        -{pr.deletions}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {pr.changedFiles}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
