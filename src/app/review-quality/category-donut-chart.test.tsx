// @vitest-environment jsdom
// US-2.08: Category donut chart tests
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryDonutChart } from "./category-donut-chart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="pie">{children}</div>
  ),
  Cell: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

describe("CategoryDonutChart", () => {
  it("shows empty message when no data", () => {
    render(<CategoryDonutChart data={[]} />);
    expect(screen.getByText(/No classified comments/)).toBeInTheDocument();
  });

  it("renders pie chart when data is available", () => {
    render(
      <CategoryDonutChart
        data={[
          { category: "bug_correctness", count: 5 },
          { category: "security", count: 3 },
        ]}
      />,
    );

    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });

  it("shows total count", () => {
    render(
      <CategoryDonutChart
        data={[
          { category: "bug_correctness", count: 5 },
          { category: "security", count: 3 },
        ]}
      />,
    );

    expect(screen.getByText(/8 comments/)).toBeInTheDocument();
  });
});
