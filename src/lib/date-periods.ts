// US-019: Date period utilities for dashboard period selector

export type PeriodPreset =
  | "this-week"
  | "last-week"
  | "this-sprint"
  | "last-sprint"
  | "this-month"
  | "last-month"
  | "this-quarter"
  | "last-quarter";

export interface DateRange {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  label: string; // Human-readable label
}

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  "this-week": "This week",
  "last-week": "Last week",
  "this-sprint": "This sprint",
  "last-sprint": "Last sprint",
  "this-month": "This month",
  "last-month": "Last month",
  "this-quarter": "This quarter",
  "last-quarter": "Last quarter",
};

/** Get the Monday (start) of the ISO week containing the given date */
export function getISOWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // Monday offset
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Get the Sunday (end) of the ISO week containing the given date */
export function getISOWeekEnd(date: Date): Date {
  const start = getISOWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/** Get the start of the calendar month */
export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Get the end of the calendar month */
export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/** Get the start of the calendar quarter */
export function getQuarterStart(date: Date): Date {
  const quarterMonth = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), quarterMonth, 1);
}

/** Get the end of the calendar quarter */
export function getQuarterEnd(date: Date): Date {
  const quarterMonth = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), quarterMonth + 3, 0, 23, 59, 59, 999);
}

/**
 * Sprint calculation: 2-week periods aligned to a known Monday origin.
 * Default origin: 2024-01-01 (a Monday).
 */
const DEFAULT_SPRINT_ORIGIN = new Date(2024, 0, 1); // 2024-01-01

export function getSprintStart(
  date: Date,
  sprintOrigin: Date = DEFAULT_SPRINT_ORIGIN,
): Date {
  const diffMs = date.getTime() - sprintOrigin.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const sprintDayOffset = ((diffDays % 14) + 14) % 14; // Handle negative modulo
  const start = new Date(date);
  start.setDate(start.getDate() - sprintDayOffset);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getSprintEnd(
  date: Date,
  sprintOrigin: Date = DEFAULT_SPRINT_ORIGIN,
): Date {
  const start = getSprintStart(date, sprintOrigin);
  const end = new Date(start);
  end.setDate(end.getDate() + 13);
  end.setHours(23, 59, 59, 999);
  return end;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateLabel(start: Date, end: Date): string {
  const startStr = formatShortDate(start);
  const endStr = formatShortDate(end);
  const year = end.getFullYear();
  return `${startStr} – ${endStr}, ${year}`;
}

export function getDateRangeForPreset(
  preset: PeriodPreset,
  referenceDate: Date = new Date(),
): DateRange {
  let start: Date;
  let end: Date;

  switch (preset) {
    case "this-week":
      start = getISOWeekStart(referenceDate);
      end = getISOWeekEnd(referenceDate);
      break;
    case "last-week": {
      const lastWeek = new Date(referenceDate);
      lastWeek.setDate(lastWeek.getDate() - 7);
      start = getISOWeekStart(lastWeek);
      end = getISOWeekEnd(lastWeek);
      break;
    }
    case "this-sprint":
      start = getSprintStart(referenceDate);
      end = getSprintEnd(referenceDate);
      break;
    case "last-sprint": {
      const lastSprint = new Date(referenceDate);
      lastSprint.setDate(lastSprint.getDate() - 14);
      start = getSprintStart(lastSprint);
      end = getSprintEnd(lastSprint);
      break;
    }
    case "this-month":
      start = getMonthStart(referenceDate);
      end = getMonthEnd(referenceDate);
      break;
    case "last-month": {
      const lastMonth = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth() - 1,
        1,
      );
      start = getMonthStart(lastMonth);
      end = getMonthEnd(lastMonth);
      break;
    }
    case "this-quarter":
      start = getQuarterStart(referenceDate);
      end = getQuarterEnd(referenceDate);
      break;
    case "last-quarter": {
      const lastQuarter = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth() - 3,
        1,
      );
      start = getQuarterStart(lastQuarter);
      end = getQuarterEnd(lastQuarter);
      break;
    }
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    label: formatDateLabel(start, end),
  };
}

// US-025: Quarter options for sync page selector
export interface QuarterOption {
  value: string; // e.g., "2025-Q4"
  label: string; // e.g., "Since Q4 2025"
  startDate: string; // ISO date string
}

export function getQuarterOptions(
  count: number = 6,
  referenceDate: Date = new Date(),
): QuarterOption[] {
  const options: QuarterOption[] = [];
  let current = getQuarterStart(referenceDate);

  for (let i = 0; i < count; i++) {
    const year = current.getFullYear();
    const quarter = Math.floor(current.getMonth() / 3) + 1;
    options.push({
      value: `${year}-Q${quarter}`,
      label: `Since Q${quarter} ${year}`,
      startDate: current.toISOString(),
    });
    current = new Date(current.getFullYear(), current.getMonth() - 3, 1);
  }

  return options;
}

export function getDefaultQuarter(
  referenceDate: Date = new Date(),
): string {
  const prevQuarter = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() - 3,
    1,
  );
  const year = getQuarterStart(prevQuarter).getFullYear();
  const quarter =
    Math.floor(getQuarterStart(prevQuarter).getMonth() / 3) + 1;
  return `${year}-Q${quarter}`;
}
