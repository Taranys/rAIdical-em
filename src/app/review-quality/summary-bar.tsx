// US-2.07: Category distribution summary bar (horizontal stacked bar chart, CSS only)
"use client";

import { CATEGORY_CONFIG } from "@/lib/category-colors";
import type { CommentCategory } from "@/lib/llm/classifier";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CategoryDistribution {
  category: string;
  count: number;
}

interface SummaryBarProps {
  classified: CategoryDistribution[];
  unclassifiedCount: number;
}

export function SummaryBar({ classified, unclassifiedCount }: SummaryBarProps) {
  const totalClassified = classified.reduce((sum, c) => sum + c.count, 0);
  const total = totalClassified + unclassifiedCount;

  if (total === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No comments to display. Sync and classify comments first.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {totalClassified} classified / {total} total comments
        </span>
        {unclassifiedCount > 0 && (
          <span className="text-muted-foreground">
            {unclassifiedCount} pending
          </span>
        )}
      </div>

      {/* Stacked bar */}
      <TooltipProvider>
        <div className="flex h-6 w-full rounded-md overflow-hidden bg-muted">
          {classified.map((item) => {
            const config =
              CATEGORY_CONFIG[item.category as CommentCategory];
            if (!config || item.count === 0) return null;
            const widthPercent = (item.count / total) * 100;
            return (
              <Tooltip key={item.category}>
                <TooltipTrigger asChild>
                  <div
                    className={`${config.bg} transition-all`}
                    style={{ width: `${widthPercent}%` }}
                    data-testid={`bar-segment-${item.category}`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {config.label}: {item.count} ({Math.round(widthPercent)}%)
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          {unclassifiedCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="bg-muted-foreground/20 transition-all"
                  style={{ width: `${(unclassifiedCount / total) * 100}%` }}
                  data-testid="bar-segment-unclassified"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Pending: {unclassifiedCount} (
                  {Math.round((unclassifiedCount / total) * 100)}%)
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {classified
          .filter((item) => item.count > 0)
          .map((item) => {
            const config =
              CATEGORY_CONFIG[item.category as CommentCategory];
            if (!config) return null;
            return (
              <div key={item.category} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-sm ${config.bg}`} />
                <span>
                  {config.label} ({item.count})
                </span>
              </div>
            );
          })}
        {unclassifiedCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted-foreground/20" />
            <span>Pending ({unclassifiedCount})</span>
          </div>
        )}
      </div>
    </div>
  );
}
