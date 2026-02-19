// @vitest-environment jsdom
// US-021: Tests for AI ratio card component
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AiRatioCard } from "./ai-ratio-card";
import { PeriodProvider } from "./dashboard-context";

// Mock recharts to avoid canvas rendering issues in tests
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

function renderWithProvider(ui: React.ReactElement) {
  return render(<PeriodProvider>{ui}</PeriodProvider>);
}

describe("AiRatioCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading skeleton initially", () => {
    vi.spyOn(global, "fetch").mockImplementation(
      () => new Promise(() => {}),
    );

    renderWithProvider(<AiRatioCard />);
    expect(screen.getByTestId("ai-ratio-skeleton")).toBeInTheDocument();
  });

  it("shows empty state when no data", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({ byMember: [], teamTotal: [] }),
    } as Response);

    renderWithProvider(<AiRatioCard />);

    await waitFor(() => {
      expect(screen.getByText(/No PRs found/)).toBeInTheDocument();
    });
  });

  it("renders stacked bar chart and team aggregate when data is available", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({
        byMember: [
          { author: "alice", aiGenerated: "human", count: 5 },
          { author: "alice", aiGenerated: "ai", count: 3 },
          { author: "bob", aiGenerated: "human", count: 7 },
        ],
        teamTotal: [
          { aiGenerated: "human", count: 12 },
          { aiGenerated: "ai", count: 3 },
        ],
      }),
    } as Response);

    renderWithProvider(<AiRatioCard />);

    await waitFor(() => {
      expect(screen.getByText("By team member")).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
      expect(screen.getByText("Team aggregate")).toBeInTheDocument();
    });
  });

  it("shows correct team totals in description", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({
        byMember: [
          { author: "alice", aiGenerated: "human", count: 5 },
          { author: "alice", aiGenerated: "ai", count: 3 },
          { author: "bob", aiGenerated: "mixed", count: 2 },
        ],
        teamTotal: [
          { aiGenerated: "human", count: 5 },
          { aiGenerated: "ai", count: 3 },
          { aiGenerated: "mixed", count: 2 },
        ],
      }),
    } as Response);

    renderWithProvider(<AiRatioCard />);

    await waitFor(() => {
      expect(screen.getByText(/10 PRs/)).toBeInTheDocument();
      expect(screen.getByText(/5 human/)).toBeInTheDocument();
      expect(screen.getByText(/3 AI/)).toBeInTheDocument();
      expect(screen.getByText(/2 mixed/)).toBeInTheDocument();
    });
  });
});
