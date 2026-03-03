// @vitest-environment jsdom
// US-023 + improve-menu-ux: App sidebar tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { SidebarStatus } from "@/hooks/use-sidebar-status";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

// Mock useSidebarStatus hook
const mockUseSidebarStatus = vi.fn<() => SidebarStatus>();
vi.mock("@/hooks/use-sidebar-status", () => ({
  useSidebarStatus: () => mockUseSidebarStatus(),
}));

import { usePathname } from "next/navigation";
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

const DEFAULT_STATUS: SidebarStatus = {
  settings: { configured: false },
  team: { configured: false },
  sync: { hasRun: false, status: null },
};

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
    mockUseSidebarStatus.mockReturnValue(DEFAULT_STATUS);
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

    // Configuration group contains Settings, Skills, Team, Sync
    expect(configGroup.textContent).toContain("Settings");
    expect(configGroup.textContent).toContain("Skills");
    expect(configGroup.textContent).toContain("Team");
    expect(configGroup.textContent).toContain("Sync");

    // Analyse group should NOT contain config items
    expect(analyseGroup.textContent).not.toContain("Settings");
    expect(analyseGroup.textContent).not.toContain("Sync");
  });

  // Configuration group order: Settings → Skills → Team → Sync
  it("orders Configuration items as Settings, Skills, Team, Sync", () => {
    const { container } = renderSidebar();
    const configGroup = container.querySelectorAll("[data-sidebar='group']")[1];
    const links = configGroup.querySelectorAll("a");
    const titles = Array.from(links).map((a) => a.textContent?.replace(/\s+/g, " ").trim());

    expect(titles[0]).toContain("Settings");
    expect(titles[1]).toContain("Skills");
    expect(titles[2]).toContain("Team");
    expect(titles[3]).toContain("Sync");
  });

  it("shows green check for Skills (always configured via auto-seed)", () => {
    renderSidebar();
    const icon = screen.getByTestId("status-skills");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("text-green-600");
  });

  // Status indicator tests
  describe("config status indicators", () => {
    it("shows amber alert for Settings when not configured", () => {
      renderSidebar();
      const icon = screen.getByTestId("status-settings");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("text-amber-500");
    });

    it("shows green check for Settings when configured", () => {
      mockUseSidebarStatus.mockReturnValue({
        ...DEFAULT_STATUS,
        settings: { configured: true },
      });
      renderSidebar();
      const icon = screen.getByTestId("status-settings");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("text-green-600");
    });

    it("shows amber alert for Team when no members", () => {
      renderSidebar();
      const icon = screen.getByTestId("status-team");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("text-amber-500");
    });

    it("shows green check for Team when members exist", () => {
      mockUseSidebarStatus.mockReturnValue({
        ...DEFAULT_STATUS,
        team: { configured: true },
      });
      renderSidebar();
      const icon = screen.getByTestId("status-team");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("text-green-600");
    });

    it("shows amber alert for Sync when no sync has run", () => {
      renderSidebar();
      const icon = screen.getByTestId("status-sync");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("text-amber-500");
    });

    it("shows green check for Sync when last sync was successful", () => {
      mockUseSidebarStatus.mockReturnValue({
        ...DEFAULT_STATUS,
        sync: { hasRun: true, status: "success" },
      });
      renderSidebar();
      const icon = screen.getByTestId("status-sync");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("text-green-600");
    });

    it("shows red alert for Sync when last sync had an error", () => {
      mockUseSidebarStatus.mockReturnValue({
        ...DEFAULT_STATUS,
        sync: { hasRun: true, status: "error" },
      });
      renderSidebar();
      const icon = screen.getByTestId("status-sync");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("text-red-500");
    });

    it("shows spinning loader for Sync when sync is running", () => {
      mockUseSidebarStatus.mockReturnValue({
        ...DEFAULT_STATUS,
        sync: { hasRun: true, status: "running" },
      });
      renderSidebar();
      const icon = screen.getByTestId("status-sync");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("animate-spin");
      expect(icon).toHaveClass("text-blue-500");
    });
  });
});
