// US-2.15: Classification Run History — displays past classification runs with pagination and error details
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";

export interface ClassificationRun {
  id: number;
  startedAt: string;
  completedAt: string | null;
  status: string;
  commentsProcessed: number;
  errors: number;
  modelUsed: string;
}

const PAGE_SIZE = 10;

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}

function computeDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return "In progress";
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffMs = end - start;
  if (diffMs < 0) return "—";
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "success"
      ? "default"
      : status === "running"
        ? "secondary"
        : "destructive";
  return (
    <Badge variant={variant} data-testid="status-badge">
      {status}
    </Badge>
  );
}

export function ClassificationRunHistory() {
  const [runs, setRuns] = useState<ClassificationRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [expandedRunId, setExpandedRunId] = useState<number | null>(null);
  const initRef = useRef(false);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/review-quality/classification-runs");
      const data = await res.json();
      setRuns(data.runs ?? []);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    fetchRuns();
  }, [fetchRuns]);

  const totalPages = Math.max(1, Math.ceil(runs.length / PAGE_SIZE));
  const pagedRuns = runs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading classification history...</p>;
  }

  if (runs.length === 0) {
    return (
      <p className="text-muted-foreground" data-testid="no-runs-message">
        No classification runs yet.
      </p>
    );
  }

  return (
    <div data-testid="classification-run-history">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Started</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Model</TableHead>
            <TableHead className="text-right">Processed</TableHead>
            <TableHead className="text-right">Errors</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagedRuns.map((run) => (
            <>
              <TableRow key={run.id}>
                <TableCell>{formatDateTime(run.startedAt)}</TableCell>
                <TableCell>{computeDuration(run.startedAt, run.completedAt)}</TableCell>
                <TableCell>
                  <StatusBadge status={run.status} />
                </TableCell>
                <TableCell className="font-mono text-xs">{run.modelUsed}</TableCell>
                <TableCell className="text-right">{run.commentsProcessed}</TableCell>
                <TableCell className="text-right">
                  {run.errors > 0 ? (
                    <span className="text-destructive font-medium">{run.errors}</span>
                  ) : (
                    run.errors
                  )}
                </TableCell>
                <TableCell>
                  {run.errors > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedRunId(expandedRunId === run.id ? null : run.id)
                      }
                      data-testid={`expand-errors-${run.id}`}
                    >
                      {expandedRunId === run.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
              {expandedRunId === run.id && run.errors > 0 && (
                <TableRow key={`${run.id}-errors`}>
                  <TableCell colSpan={7}>
                    <div className="bg-muted/50 rounded p-3 text-sm">
                      <p className="font-medium mb-1">Error Details</p>
                      <p className="text-muted-foreground">
                        {run.errors} error(s) occurred during this classification run.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages} ({runs.length} runs)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              data-testid="prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              data-testid="next-page"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
