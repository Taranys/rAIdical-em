// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MonthNavigator } from "./month-navigator";

describe("MonthNavigator", () => {
  it("displays the current month and year in French", () => {
    render(
      <MonthNavigator
        currentMonth={new Date(2026, 1, 1)} // February 2026
        onMonthChange={() => {}}
      />,
    );

    expect(screen.getByTestId("month-label")).toHaveTextContent(
      "février 2026",
    );
  });

  it("calls onMonthChange with previous month when clicking prev", () => {
    const onChange = vi.fn();

    render(
      <MonthNavigator
        currentMonth={new Date(2026, 1, 1)} // February 2026
        onMonthChange={onChange}
      />,
    );

    fireEvent.click(screen.getByTestId("month-prev"));

    expect(onChange).toHaveBeenCalledOnce();
    const newDate = onChange.mock.calls[0][0] as Date;
    expect(newDate.getFullYear()).toBe(2026);
    expect(newDate.getMonth()).toBe(0); // January
  });

  it("calls onMonthChange with next month when clicking next", () => {
    const onChange = vi.fn();

    render(
      <MonthNavigator
        currentMonth={new Date(2026, 1, 1)} // February 2026
        onMonthChange={onChange}
      />,
    );

    fireEvent.click(screen.getByTestId("month-next"));

    expect(onChange).toHaveBeenCalledOnce();
    const newDate = onChange.mock.calls[0][0] as Date;
    expect(newDate.getFullYear()).toBe(2026);
    expect(newDate.getMonth()).toBe(2); // March
  });

  it("handles year transition: January prev goes to December previous year", () => {
    const onChange = vi.fn();

    render(
      <MonthNavigator
        currentMonth={new Date(2026, 0, 1)} // January 2026
        onMonthChange={onChange}
      />,
    );

    fireEvent.click(screen.getByTestId("month-prev"));

    const newDate = onChange.mock.calls[0][0] as Date;
    expect(newDate.getFullYear()).toBe(2025);
    expect(newDate.getMonth()).toBe(11); // December
  });

  it("handles year transition: December next goes to January next year", () => {
    const onChange = vi.fn();

    render(
      <MonthNavigator
        currentMonth={new Date(2025, 11, 1)} // December 2025
        onMonthChange={onChange}
      />,
    );

    fireEvent.click(screen.getByTestId("month-next"));

    const newDate = onChange.mock.calls[0][0] as Date;
    expect(newDate.getFullYear()).toBe(2026);
    expect(newDate.getMonth()).toBe(0); // January
  });
});
