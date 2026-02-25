// @vitest-environment jsdom
// US-2.11: Seniority radar chart tests
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SeniorityRadarChart } from "./seniority-radar-chart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  RadarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="radar-chart">{children}</div>
  ),
  Radar: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  Tooltip: () => null,
}));

describe("SeniorityRadarChart", () => {
  it("shows empty message when no profiles", () => {
    render(<SeniorityRadarChart profiles={[]} color="#E25A3B" />);
    expect(
      screen.getByText(/No seniority profile computed yet/),
    ).toBeInTheDocument();
  });

  it("renders radar chart when profiles are available", () => {
    render(
      <SeniorityRadarChart
        profiles={[
          {
            dimensionName: "security",
            dimensionFamily: "technical",
            maturityLevel: "senior",
          },
          {
            dimensionName: "pedagogy",
            dimensionFamily: "soft_skill",
            maturityLevel: "junior",
          },
        ]}
        color="#E25A3B"
      />,
    );

    expect(screen.getByTestId("radar-chart")).toBeInTheDocument();
  });
});
