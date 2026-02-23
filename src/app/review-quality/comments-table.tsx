// US-2.07: Comments table with sortable columns and category badges
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_CONFIG } from "@/lib/category-colors";
import type { CommentCategory } from "@/lib/llm/classifier";
import { ArrowUpDown, ExternalLink } from "lucide-react";

export interface ClassifiedComment {
  commentType: "review_comment" | "pr_comment";
  commentId: number;
  reviewer: string;
  body: string;
  filePath: string | null;
  createdAt: string;
  prTitle: string;
  prNumber: number;
  category: string | null;
  confidence: number | null;
  reasoning: string | null;
  classifiedAt: string | null;
}

interface CommentsTableProps {
  comments: ClassifiedComment[];
  sortBy: string;
  sortOrder: string;
  onSortChange: (sortBy: "date" | "confidence" | "category") => void;
  onSelect: (comment: ClassifiedComment) => void;
  repoUrl: string | null;
}

function truncateBody(body: string, maxLength = 100): string {
  if (body.length <= maxLength) return body;
  return body.slice(0, maxLength) + "...";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) {
    return (
      <Badge variant="outline" className="opacity-50">
        Pending
      </Badge>
    );
  }
  const config = CATEGORY_CONFIG[category as CommentCategory];
  if (!config) {
    return <Badge variant="outline">{category}</Badge>;
  }
  return <Badge className={`${config.bg} ${config.text} border-0`}>{config.label}</Badge>;
}

function SortableHeader({
  label,
  sortKey,
  currentSortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  sortKey: "date" | "confidence" | "category";
  currentSortBy: string;
  sortOrder: string;
  onSort: (key: "date" | "confidence" | "category") => void;
}) {
  const isActive = currentSortBy === sortKey;
  return (
    <TableHead
      className="cursor-pointer select-none"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${isActive ? "opacity-100" : "opacity-30"}`}
        />
        {isActive && (
          <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
        )}
      </div>
    </TableHead>
  );
}

export function CommentsTable({
  comments,
  sortBy,
  sortOrder,
  onSortChange,
  onSelect,
  repoUrl,
}: CommentsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  function toggleExpand(key: string, e: React.MouseEvent) {
    e.stopPropagation();
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No comments match the current filters.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reviewer</TableHead>
          <TableHead className="min-w-[250px]">Comment</TableHead>
          <SortableHeader
            label="Category"
            sortKey="category"
            currentSortBy={sortBy}
            sortOrder={sortOrder}
            onSort={onSortChange}
          />
          <SortableHeader
            label="Confidence"
            sortKey="confidence"
            currentSortBy={sortBy}
            sortOrder={sortOrder}
            onSort={onSortChange}
          />
          <TableHead>PR</TableHead>
          <SortableHeader
            label="Date"
            sortKey="date"
            currentSortBy={sortBy}
            sortOrder={sortOrder}
            onSort={onSortChange}
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {comments.map((comment) => {
          const rowKey = `${comment.commentType}-${comment.commentId}`;
          const isExpanded = expandedRows.has(rowKey);
          const isUnclassified = comment.category === null;

          return (
            <TableRow
              key={rowKey}
              className={`cursor-pointer hover:bg-muted/50 ${isUnclassified ? "opacity-50" : ""}`}
              onClick={() => onSelect(comment)}
              data-testid={`comment-row-${rowKey}`}
            >
              <TableCell className="font-medium">{comment.reviewer}</TableCell>
              <TableCell>
                <div className="text-sm">
                  {isExpanded ? comment.body : truncateBody(comment.body)}
                  {comment.body.length > 100 && (
                    <button
                      className="ml-1 text-xs text-primary underline"
                      onClick={(e) => toggleExpand(rowKey, e)}
                    >
                      {isExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <CategoryBadge category={comment.category} />
              </TableCell>
              <TableCell>
                {comment.confidence !== null ? (
                  <span className="text-sm font-mono">
                    {comment.confidence}%
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <span className="truncate max-w-[150px]">
                    {comment.prTitle}
                  </span>
                  {repoUrl && (
                    <a
                      href={`${repoUrl}/pull/${comment.prNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(comment.createdAt)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
