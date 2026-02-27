// Navigation par mois pour les classified comments
"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthNavigatorProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function MonthNavigator({
  currentMonth,
  onMonthChange,
}: MonthNavigatorProps) {
  function goToPreviousMonth() {
    const prev = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1,
    );
    onMonthChange(prev);
  }

  function goToNextMonth() {
    const next = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1,
    );
    onMonthChange(next);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={goToPreviousMonth}
        data-testid="month-prev"
        aria-label="Mois précédent"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span
        className="text-sm font-medium min-w-[160px] text-center capitalize"
        data-testid="month-label"
      >
        {formatMonth(currentMonth)}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={goToNextMonth}
        data-testid="month-next"
        aria-label="Mois suivant"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
