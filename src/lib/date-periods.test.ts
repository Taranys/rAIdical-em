// US-019: Unit tests for date period utilities
import {
  getISOWeekStart,
  getISOWeekEnd,
  getMonthStart,
  getMonthEnd,
  getQuarterStart,
  getQuarterEnd,
  getSprintStart,
  getSprintEnd,
  getDateRangeForPreset,
  getQuarterOptions,
  getDefaultQuarter,
} from "./date-periods";

describe("date-periods", () => {
  describe("getISOWeekStart", () => {
    it("returns Monday for a Wednesday", () => {
      // 2026-02-18 is a Wednesday
      const result = getISOWeekStart(new Date(2026, 1, 18));
      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(16);
      expect(result.getMonth()).toBe(1); // February
    });

    it("returns Monday for a Monday", () => {
      // 2026-02-16 is a Monday
      const result = getISOWeekStart(new Date(2026, 1, 16));
      expect(result.getDay()).toBe(1);
      expect(result.getDate()).toBe(16);
    });

    it("returns Monday for a Sunday", () => {
      // 2026-02-22 is a Sunday
      const result = getISOWeekStart(new Date(2026, 1, 22));
      expect(result.getDay()).toBe(1);
      expect(result.getDate()).toBe(16);
    });
  });

  describe("getISOWeekEnd", () => {
    it("returns Sunday for a Wednesday", () => {
      const result = getISOWeekEnd(new Date(2026, 1, 18));
      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getDate()).toBe(22);
    });
  });

  describe("getMonthStart / getMonthEnd", () => {
    it("returns first and last day of February 2026", () => {
      const ref = new Date(2026, 1, 15);
      const start = getMonthStart(ref);
      const end = getMonthEnd(ref);
      expect(start.getDate()).toBe(1);
      expect(start.getMonth()).toBe(1);
      expect(end.getDate()).toBe(28); // 2026 is not a leap year
      expect(end.getMonth()).toBe(1);
    });

    it("handles December correctly", () => {
      const ref = new Date(2025, 11, 15); // December 2025
      const start = getMonthStart(ref);
      const end = getMonthEnd(ref);
      expect(start.getDate()).toBe(1);
      expect(end.getDate()).toBe(31);
    });
  });

  describe("getQuarterStart / getQuarterEnd", () => {
    it("Q1: January-March", () => {
      const ref = new Date(2026, 1, 15); // February
      expect(getQuarterStart(ref).getMonth()).toBe(0); // January
      expect(getQuarterEnd(ref).getMonth()).toBe(2); // March
      expect(getQuarterEnd(ref).getDate()).toBe(31);
    });

    it("Q2: April-June", () => {
      const ref = new Date(2026, 4, 15); // May
      expect(getQuarterStart(ref).getMonth()).toBe(3); // April
      expect(getQuarterEnd(ref).getMonth()).toBe(5); // June
      expect(getQuarterEnd(ref).getDate()).toBe(30);
    });

    it("Q3: July-September", () => {
      const ref = new Date(2026, 7, 15); // August
      expect(getQuarterStart(ref).getMonth()).toBe(6); // July
      expect(getQuarterEnd(ref).getMonth()).toBe(8); // September
    });

    it("Q4: October-December", () => {
      const ref = new Date(2025, 10, 15); // November
      expect(getQuarterStart(ref).getMonth()).toBe(9); // October
      expect(getQuarterEnd(ref).getMonth()).toBe(11); // December
      expect(getQuarterEnd(ref).getDate()).toBe(31);
    });
  });

  describe("getSprintStart / getSprintEnd", () => {
    it("sprint is 14 days long", () => {
      const ref = new Date(2026, 1, 18);
      const start = getSprintStart(ref);
      const end = getSprintEnd(ref);
      // End is day+13 at 23:59:59, so 14 calendar days inclusive
      expect(end.getDate() - start.getDate() + 1).toBe(14);
    });

    it("sprint start is a Monday (aligned to origin)", () => {
      const ref = new Date(2026, 1, 18);
      const start = getSprintStart(ref);
      expect(start.getDay()).toBe(1); // Monday
    });
  });

  describe("getDateRangeForPreset", () => {
    const ref = new Date(2026, 1, 18); // Wed Feb 18 2026

    it("this-week returns current ISO week", () => {
      const range = getDateRangeForPreset("this-week", ref);
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      expect(start.getDate()).toBe(16); // Monday
      expect(end.getDate()).toBe(22); // Sunday
    });

    it("last-week returns previous ISO week", () => {
      const range = getDateRangeForPreset("last-week", ref);
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      expect(start.getDate()).toBe(9);
      expect(end.getDate()).toBe(15);
    });

    it("this-month returns February 2026", () => {
      const range = getDateRangeForPreset("this-month", ref);
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      expect(start.getDate()).toBe(1);
      expect(start.getMonth()).toBe(1);
      expect(end.getDate()).toBe(28);
    });

    it("last-month returns January 2026", () => {
      const range = getDateRangeForPreset("last-month", ref);
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      expect(start.getMonth()).toBe(0);
      expect(end.getMonth()).toBe(0);
      expect(end.getDate()).toBe(31);
    });

    it("this-quarter returns Q1 2026", () => {
      const range = getDateRangeForPreset("this-quarter", ref);
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      expect(start.getMonth()).toBe(0); // January
      expect(end.getMonth()).toBe(2); // March
    });

    it("last-quarter returns Q4 2025", () => {
      const range = getDateRangeForPreset("last-quarter", ref);
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      expect(start.getFullYear()).toBe(2025);
      expect(start.getMonth()).toBe(9); // October
      expect(end.getMonth()).toBe(11); // December
    });

    it("returns a human-readable label", () => {
      const range = getDateRangeForPreset("this-week", ref);
      expect(range.label).toContain("2026");
    });
  });

  describe("getQuarterOptions", () => {
    it("returns the requested number of quarter options", () => {
      const ref = new Date(2026, 1, 18);
      const options = getQuarterOptions(4, ref);
      expect(options).toHaveLength(4);
    });

    it("starts with the current quarter", () => {
      const ref = new Date(2026, 1, 18); // Q1 2026
      const options = getQuarterOptions(4, ref);
      expect(options[0].value).toBe("2026-Q1");
      expect(options[1].value).toBe("2025-Q4");
      expect(options[2].value).toBe("2025-Q3");
      expect(options[3].value).toBe("2025-Q2");
    });

    it("each option has a valid startDate", () => {
      const options = getQuarterOptions(2, new Date(2026, 1, 18));
      for (const opt of options) {
        expect(new Date(opt.startDate).toISOString()).toBe(opt.startDate);
      }
    });
  });

  describe("getDefaultQuarter", () => {
    it("returns previous quarter", () => {
      // In Q1 2026, default should be Q4 2025
      const result = getDefaultQuarter(new Date(2026, 1, 18));
      expect(result).toBe("2025-Q4");
    });

    it("handles Q1 → previous year Q4", () => {
      const result = getDefaultQuarter(new Date(2026, 0, 15)); // Jan Q1
      expect(result).toBe("2025-Q4");
    });
  });
});
