"use client";

// US-019: Period selector dropdown for dashboard
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERIOD_LABELS, type PeriodPreset } from "@/lib/date-periods";
import { usePeriod } from "./dashboard-context";

const PERIOD_OPTIONS: PeriodPreset[] = [
  "this-week",
  "last-week",
  "this-sprint",
  "last-sprint",
  "this-month",
  "last-month",
  "this-quarter",
  "last-quarter",
];

export function PeriodSelector() {
  const { preset, setPeriod, period } = usePeriod();

  return (
    <div className="flex flex-col items-end gap-1">
      <Select
        value={preset}
        onValueChange={(value) => setPeriod(value as PeriodPreset)}
      >
        <SelectTrigger className="w-[200px]" data-testid="period-selector">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {PERIOD_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{period.label}</p>
    </div>
  );
}
