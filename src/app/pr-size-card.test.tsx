// @vitest-environment jsdom
// US-016: Tests for PR size card component
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { PrSizeCard } from "./pr-size-card";
import { PeriodProvider } from "./dashboard-context";

function renderWithProvider(ui: React.ReactElement) {
  return render(<PeriodProvider>{ui}</PeriodProvider>);
}

describe("PrSizeCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading skeleton initially", () => {
    vi.spyOn(global, "fetch").mockImplementation(() => new Promise(() => {}));
    renderWithProvider(<PrSizeCard />);
    expect(screen.getByTestId("pr-size-skeleton")).toBeInTheDocument();
  });

  it("shows empty state when no data", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({ byMember: [] }),
    } as Response);

    renderWithProvider(<PrSizeCard />);
    await waitFor(() => {
      expect(screen.getByText(/No PRs found/)).toBeInTheDocument();
    });
  });

  it("renders table with member data", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({
        byMember: [
          { author: "alice", medianAdditions: 100, medianDeletions: 30, prCount: 5 },
          { author: "bob", medianAdditions: 600, medianDeletions: 200, prCount: 3 },
        ],
      }),
    } as Response);

    renderWithProvider(<PrSizeCard />);
    await waitFor(() => {
      expect(screen.getByText("alice")).toBeInTheDocument();
      expect(screen.getByText("bob")).toBeInTheDocument();
    });
  });

  it("highlights large PRs with color coding", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({
        byMember: [
          { author: "bob", medianAdditions: 600, medianDeletions: 200, prCount: 3 },
        ],
      }),
    } as Response);

    renderWithProvider(<PrSizeCard />);
    await waitFor(() => {
      // bob's median total is 800 > 500 threshold
      const row = screen.getByTestId("member-row-bob");
      expect(row.className).toContain("bg-red");
    });
  });

  it("expands row to show individual PRs when clicked", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        json: async () => ({
          byMember: [
            { author: "alice", medianAdditions: 100, medianDeletions: 30, prCount: 2 },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({
          prs: [
            { id: 1, number: 42, title: "Fix bug", additions: 50, deletions: 10, changedFiles: 2, createdAt: "2026-02-10T10:00:00Z" },
          ],
        }),
      } as Response);

    renderWithProvider(<PrSizeCard />);
    await waitFor(() => {
      expect(screen.getByText("alice")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("member-row-alice"));

    await waitFor(() => {
      expect(screen.getByText("#42")).toBeInTheDocument();
      expect(screen.getByText("Fix bug")).toBeInTheDocument();
    });
  });
});
