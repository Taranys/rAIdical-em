// US-2.07: Filter bar for comment classification results
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMMENT_CATEGORIES } from "@/lib/llm/classifier";
import { CATEGORY_CONFIG } from "@/lib/category-colors";
import type { CommentCategory } from "@/lib/llm/classifier";

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

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  teamMembers: TeamMember[];
}

export function FilterBar({ filters, onChange, teamMembers }: FilterBarProps) {
  function update(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* Category filter */}
      <div className="space-y-1">
        <Label htmlFor="filter-category" className="text-xs">
          Category
        </Label>
        <Select
          value={filters.category}
          onValueChange={(v) => update("category", v)}
        >
          <SelectTrigger id="filter-category" className="w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {COMMENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_CONFIG[cat as CommentCategory].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reviewer filter */}
      <div className="space-y-1">
        <Label htmlFor="filter-reviewer" className="text-xs">
          Reviewer
        </Label>
        <Select
          value={filters.reviewer}
          onValueChange={(v) => update("reviewer", v)}
        >
          <SelectTrigger id="filter-reviewer" className="w-[180px]">
            <SelectValue placeholder="All reviewers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reviewers</SelectItem>
            {teamMembers.map((m) => (
              <SelectItem key={m.githubUsername} value={m.githubUsername}>
                {m.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date range */}
      <div className="space-y-1">
        <Label htmlFor="filter-date-start" className="text-xs">
          From
        </Label>
        <Input
          id="filter-date-start"
          type="date"
          className="w-[150px]"
          value={filters.dateStart}
          onChange={(e) => update("dateStart", e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="filter-date-end" className="text-xs">
          To
        </Label>
        <Input
          id="filter-date-end"
          type="date"
          className="w-[150px]"
          value={filters.dateEnd}
          onChange={(e) => update("dateEnd", e.target.value)}
        />
      </div>

      {/* Confidence threshold */}
      <div className="space-y-1">
        <Label htmlFor="filter-confidence" className="text-xs">
          Min confidence
        </Label>
        <Input
          id="filter-confidence"
          type="number"
          min={0}
          max={100}
          className="w-[100px]"
          placeholder="0"
          value={filters.minConfidence}
          onChange={(e) => update("minConfidence", e.target.value)}
        />
      </div>
    </div>
  );
}
