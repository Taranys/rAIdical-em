// @vitest-environment jsdom
// US-2.08: Category trend line chart tests
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryTrendChart } from "./category-trend-chart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

describe("CategoryTrendChart", () => {
  it("shows empty message when no data", () => {
    render(<CategoryTrendChart data={[]} />);
    expect(screen.getByText(/Not enough data/)).toBeInTheDocument();
  });

  it("renders line chart when data spans multiple weeks", () => {
    render(
      <CategoryTrendChart
        data={[
          { week: "2026-W05", category: "bug_correctness", count: 3 },
          { week: "2026-W06", category: "bug_correctness", count: 5 },
          { week: "2026-W06", category: "security", count: 2 },
        ]}
      />,
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("shows empty message when only one week of data", () => {
    render(
      <CategoryTrendChart
        data={[
          { week: "2026-W05", category: "bug_correctness", count: 3 },
        ]}
      />,
    );

    expect(screen.getByText(/Not enough data/)).toBeInTheDocument();
  });
});
