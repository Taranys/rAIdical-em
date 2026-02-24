// @vitest-environment jsdom
// US-2.08: Category per-person stacked bar chart tests
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryPerPersonChart } from "./category-per-person-chart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

describe("CategoryPerPersonChart", () => {
  it("shows empty message when no data", () => {
    render(<CategoryPerPersonChart data={[]} />);
    expect(screen.getByText(/No per-person data/)).toBeInTheDocument();
  });

  it("renders bar chart when data is available", () => {
    render(
      <CategoryPerPersonChart
        data={[
          { reviewer: "alice", category: "bug_correctness", count: 3 },
          { reviewer: "alice", category: "security", count: 2 },
          { reviewer: "bob", category: "nitpick_style", count: 4 },
        ]}
      />,
    );

    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });
});
