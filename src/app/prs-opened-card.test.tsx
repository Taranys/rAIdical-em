// @vitest-environment jsdom
// US-015: Tests for PRs opened card component
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { PrsOpenedCard } from "./prs-opened-card";
import { PeriodProvider } from "./dashboard-context";

// Mock recharts to avoid canvas rendering issues in tests
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ children }: { children?: React.ReactNode }) => <div data-testid="bar">{children}</div>,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
}));

vi.mock("./team-colors-context", () => ({
  useTeamColors: () => ({}),
}));

function renderWithProvider(ui: React.ReactElement) {
  return render(<PeriodProvider>{ui}</PeriodProvider>);
}

describe("PrsOpenedCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading skeleton initially", () => {
    vi.spyOn(global, "fetch").mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    renderWithProvider(<PrsOpenedCard />);
    expect(screen.getByTestId("prs-opened-skeleton")).toBeInTheDocument();
  });

  it("shows empty state when no data", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({ byMember: [], byWeek: [] }),
    } as Response);

    renderWithProvider(<PrsOpenedCard />);

    await waitFor(() => {
      expect(screen.getByText(/No PRs found/)).toBeInTheDocument();
    });
  });

  it("renders bar chart when data is available", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({
        byMember: [
          { author: "alice", count: 5 },
          { author: "bob", count: 3 },
        ],
        byWeek: [
          { week: "2026-W06", count: 4 },
          { week: "2026-W07", count: 4 },
        ],
      }),
    } as Response);

    renderWithProvider(<PrsOpenedCard />);

    await waitFor(() => {
      expect(screen.getByText("By team member")).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });
  });

  it("shows total PR count in description", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({
        byMember: [
          { author: "alice", count: 5 },
          { author: "bob", count: 3 },
        ],
        byWeek: [],
      }),
    } as Response);

    renderWithProvider(<PrsOpenedCard />);

    await waitFor(() => {
      expect(screen.getByText(/8 PRs opened/)).toBeInTheDocument();
    });
  });
});
