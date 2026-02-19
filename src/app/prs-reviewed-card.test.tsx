// @vitest-environment jsdom
// US-017: Tests for PRs reviewed card component
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { PrsReviewedCard } from "./prs-reviewed-card";
import { PeriodProvider } from "./dashboard-context";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

function renderWithProvider(ui: React.ReactElement) {
  return render(<PeriodProvider>{ui}</PeriodProvider>);
}

describe("PrsReviewedCard", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("shows loading skeleton initially", () => {
    vi.spyOn(global, "fetch").mockImplementation(() => new Promise(() => {}));
    renderWithProvider(<PrsReviewedCard />);
    expect(screen.getByTestId("prs-reviewed-skeleton")).toBeInTheDocument();
  });

  it("shows empty state when no reviews", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({ byMember: [] }),
    } as Response);

    renderWithProvider(<PrsReviewedCard />);
    await waitFor(() => {
      expect(screen.getByText(/No reviews found/)).toBeInTheDocument();
    });
  });

  it("renders bar chart and table with data", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({
        byMember: [
          { reviewer: "alice", count: 10 },
          { reviewer: "bob", count: 5 },
        ],
      }),
    } as Response);

    renderWithProvider(<PrsReviewedCard />);
    await waitFor(() => {
      expect(screen.getByText("alice")).toBeInTheDocument();
      expect(screen.getByText("bob")).toBeInTheDocument();
      expect(screen.getByText(/15 PRs reviewed/)).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });
  });

  it("shows members ordered from most to least active", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({
        byMember: [
          { reviewer: "alice", count: 10 },
          { reviewer: "bob", count: 5 },
        ],
      }),
    } as Response);

    renderWithProvider(<PrsReviewedCard />);
    await waitFor(() => {
      const rows = screen.getAllByRole("row");
      // header + 2 data rows in the table section
      const dataRows = rows.filter((r) => r.textContent?.includes("alice") || r.textContent?.includes("bob"));
      expect(dataRows[0].textContent).toContain("alice");
      expect(dataRows[1].textContent).toContain("bob");
    });
  });
});
