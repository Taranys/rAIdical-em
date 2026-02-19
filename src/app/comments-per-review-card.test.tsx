// @vitest-environment jsdom
// US-018: Tests for comments per review card component
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CommentsPerReviewCard } from "./comments-per-review-card";
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
}));

vi.mock("./team-colors-context", () => ({
  useTeamColors: () => ({}),
}));

function renderWithProvider(ui: React.ReactElement) {
  return render(<PeriodProvider>{ui}</PeriodProvider>);
}

describe("CommentsPerReviewCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading skeleton initially", () => {
    vi.spyOn(global, "fetch").mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    renderWithProvider(<CommentsPerReviewCard />);
    expect(screen.getByTestId("comments-review-skeleton")).toBeInTheDocument();
  });

  it("shows empty state when no data", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({ data: [] }),
    } as Response);

    renderWithProvider(<CommentsPerReviewCard />);

    await waitFor(() => {
      expect(screen.getByText(/No review comments found/)).toBeInTheDocument();
    });
  });

  it("renders bar chart and table when data is available", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({
        data: [
          { reviewer: "alice", totalComments: 10, prsReviewed: 5, avg: 2.0 },
          { reviewer: "bob", totalComments: 3, prsReviewed: 3, avg: 1.0 },
        ],
      }),
    } as Response);

    renderWithProvider(<CommentsPerReviewCard />);

    await waitFor(() => {
      expect(screen.getByText("Average comments per review")).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
      expect(screen.getByText("alice")).toBeInTheDocument();
      expect(screen.getByText("bob")).toBeInTheDocument();
    });
  });

  it("shows team average in description", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({
        data: [
          { reviewer: "alice", totalComments: 10, prsReviewed: 5, avg: 2.0 },
          { reviewer: "bob", totalComments: 3, prsReviewed: 3, avg: 1.0 },
        ],
      }),
    } as Response);

    renderWithProvider(<CommentsPerReviewCard />);

    await waitFor(() => {
      expect(screen.getByText(/13 comments across 8 PRs reviewed/)).toBeInTheDocument();
      expect(screen.getByText(/team avg 1.6 comments\/review/)).toBeInTheDocument();
    });
  });
});
