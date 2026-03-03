// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FilterBar, type Filters } from "./filter-bar";

const defaultFilters: Filters = {
  category: "all",
  reviewer: "all",
  minConfidence: "",
};

const teamMembers = [
  { githubUsername: "alice", displayName: "Alice A." },
  { githubUsername: "bob", displayName: "Bob B." },
];

describe("FilterBar", () => {
  it("renders the period selector with default value", () => {
    render(
      <FilterBar
        filters={defaultFilters}
        onChange={vi.fn()}
        teamMembers={teamMembers}
        periodPreset="this-month"
        onPeriodChange={vi.fn()}
      />,
    );

    const periodSelector = screen.getByTestId("period-selector");
    expect(periodSelector).toBeDefined();
    expect(periodSelector.textContent).toContain("This month");
  });

  it("renders category, reviewer, and confidence filters", () => {
    render(
      <FilterBar
        filters={defaultFilters}
        onChange={vi.fn()}
        teamMembers={teamMembers}
        periodPreset="this-month"
        onPeriodChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Period")).toBeDefined();
    expect(screen.getByLabelText("Category")).toBeDefined();
    expect(screen.getByLabelText("Reviewer")).toBeDefined();
    expect(screen.getByLabelText("Min confidence")).toBeDefined();
  });

  it("does not render dateStart or dateEnd inputs", () => {
    render(
      <FilterBar
        filters={defaultFilters}
        onChange={vi.fn()}
        teamMembers={teamMembers}
        periodPreset="this-month"
        onPeriodChange={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("From")).toBeNull();
    expect(screen.queryByLabelText("To")).toBeNull();
  });
});
