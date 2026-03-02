// @vitest-environment jsdom
// US-023 + US-013: App sidebar tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SidebarProvider } from "@/components/ui/sidebar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { usePathname } from "next/navigation";

// Import after mock setup
import { AppSidebar } from "./app-sidebar";

// jsdom does not implement window.matchMedia — mock it for SidebarProvider's use-mobile hook
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

function renderSidebar() {
  return render(
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>
  );
}

describe("AppSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePathname).mockReturnValue("/");
    // Default: no sync run
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ syncRun: null, history: [] }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the app title", () => {
    renderSidebar();
    expect(screen.getByText("rAIdical-em")).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Team$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sync/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Settings/i })).toBeInTheDocument();
  });

  it("links point to correct URLs", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /^Team$/i })).toHaveAttribute("href", "/team");
    expect(screen.getByRole("link", { name: /Sync/i })).toHaveAttribute("href", "/sync");
    expect(screen.getByRole("link", { name: /Settings/i })).toHaveAttribute("href", "/settings");
  });

  it("highlights Dashboard when pathname is /", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    renderSidebar();

    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("link", { name: /^Team$/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Sync/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Settings/i })).toHaveAttribute("data-active", "false");
  });

  it("highlights Team when pathname is /team", () => {
    vi.mocked(usePathname).mockReturnValue("/team");
    renderSidebar();

    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /^Team$/i })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("link", { name: /Sync/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Settings/i })).toHaveAttribute("data-active", "false");
  });

  it("highlights Sync when pathname is /sync", () => {
    vi.mocked(usePathname).mockReturnValue("/sync");
    renderSidebar();

    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /^Team$/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Sync/i })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("link", { name: /Settings/i })).toHaveAttribute("data-active", "false");
  });

  it("highlights Settings when pathname is /settings", () => {
    vi.mocked(usePathname).mockReturnValue("/settings");
    renderSidebar();

    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /^Team$/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Sync/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Settings/i })).toHaveAttribute("data-active", "true");
  });

  // Sidebar section separator tests
  it("renders two navigation groups with correct labels", () => {
    renderSidebar();
    expect(screen.getByText("Analyse")).toBeInTheDocument();
    expect(screen.getByText("Configuration")).toBeInTheDocument();
  });

  it("renders a separator between the two groups", () => {
    const { container } = renderSidebar();
    const separator = container.querySelector("[data-sidebar='separator']");
    expect(separator).toBeInTheDocument();
  });

  it("places analysis items in the Analyse group and config items in the Configuration group", () => {
    const { container } = renderSidebar();
    const groups = container.querySelectorAll("[data-sidebar='group']");
    expect(groups.length).toBeGreaterThanOrEqual(2);

    const analyseGroup = groups[0];
    const configGroup = groups[1];

    // Analyse group contains Dashboard, Review Quality, Team Profiles, 1:1 Prep
    expect(analyseGroup.textContent).toContain("Dashboard");
    expect(analyseGroup.textContent).toContain("Review Quality");
    expect(analyseGroup.textContent).toContain("Team Profiles");
    expect(analyseGroup.textContent).toContain("1:1 Prep");

    // Configuration group contains Team, Sync, Settings
    expect(configGroup.textContent).toContain("Team");
    expect(configGroup.textContent).toContain("Sync");
    expect(configGroup.textContent).toContain("Settings");

    // Analyse group should NOT contain config items
    expect(analyseGroup.textContent).not.toContain("Settings");
    expect(analyseGroup.textContent).not.toContain("Sync");
  });

  // US-013: Sync status emoji indicator tests
  it("shows success emoji when last sync was successful", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        syncRun: { id: 1, status: "success", prCount: 42, commentCount: 0, startedAt: "2024-06-01T10:00:00Z", completedAt: "2024-06-01T10:05:00Z", errorMessage: null },
        history: [],
      }),
    });

    renderSidebar();

    await waitFor(() => {
      const indicator = screen.getByTestId("sync-status-dot");
      expect(indicator).toBeInTheDocument();
      expect(indicator.textContent).toBe("✅");
    });
  });

  it("shows error emoji when last sync had an error", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        syncRun: { id: 1, status: "error", prCount: 5, commentCount: 0, startedAt: "2024-06-01T10:00:00Z", completedAt: "2024-06-01T10:01:00Z", errorMessage: "Error" },
        history: [],
      }),
    });

    renderSidebar();

    await waitFor(() => {
      const indicator = screen.getByTestId("sync-status-dot");
      expect(indicator).toBeInTheDocument();
      expect(indicator.textContent).toBe("❌");
    });
  });

  it("shows running emoji when sync is in progress", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        syncRun: { id: 1, status: "running", prCount: 5, commentCount: 0, startedAt: "2024-06-01T10:00:00Z", completedAt: null, errorMessage: null },
        history: [],
      }),
    });

    renderSidebar();

    await waitFor(() => {
      const indicator = screen.getByTestId("sync-status-dot");
      expect(indicator).toBeInTheDocument();
      expect(indicator.textContent).toBe("🔄");
    });
  });

  it("does not show dot when no sync has been run", async () => {
    renderSidebar();

    // Wait for fetch to complete
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("sync-status-dot")).not.toBeInTheDocument();
  });
});
