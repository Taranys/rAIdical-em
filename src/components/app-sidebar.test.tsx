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
    expect(screen.getByText("em-control-tower")).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Team/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sync/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Settings/i })).toBeInTheDocument();
  });

  it("links point to correct URLs", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Team/i })).toHaveAttribute("href", "/team");
    expect(screen.getByRole("link", { name: /Sync/i })).toHaveAttribute("href", "/sync");
    expect(screen.getByRole("link", { name: /Settings/i })).toHaveAttribute("href", "/settings");
  });

  it("highlights Dashboard when pathname is /", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    renderSidebar();

    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("link", { name: /Team/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Sync/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Settings/i })).toHaveAttribute("data-active", "false");
  });

  it("highlights Team when pathname is /team", () => {
    vi.mocked(usePathname).mockReturnValue("/team");
    renderSidebar();

    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Team/i })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("link", { name: /Sync/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Settings/i })).toHaveAttribute("data-active", "false");
  });

  it("highlights Sync when pathname is /sync", () => {
    vi.mocked(usePathname).mockReturnValue("/sync");
    renderSidebar();

    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Team/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Sync/i })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("link", { name: /Settings/i })).toHaveAttribute("data-active", "false");
  });

  it("highlights Settings when pathname is /settings", () => {
    vi.mocked(usePathname).mockReturnValue("/settings");
    renderSidebar();

    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Team/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Sync/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Settings/i })).toHaveAttribute("data-active", "true");
  });

  // US-013: Sync status dot tests
  it("shows green dot when last sync was successful", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        syncRun: { id: 1, status: "success", prCount: 42, commentCount: 0, startedAt: "2024-06-01T10:00:00Z", completedAt: "2024-06-01T10:05:00Z", errorMessage: null },
        history: [],
      }),
    });

    renderSidebar();

    await waitFor(() => {
      const dot = screen.getByTestId("sync-status-dot");
      expect(dot).toBeInTheDocument();
      expect(dot.className).toContain("bg-green-500");
    });
  });

  it("shows red dot when last sync had an error", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        syncRun: { id: 1, status: "error", prCount: 5, commentCount: 0, startedAt: "2024-06-01T10:00:00Z", completedAt: "2024-06-01T10:01:00Z", errorMessage: "Error" },
        history: [],
      }),
    });

    renderSidebar();

    await waitFor(() => {
      const dot = screen.getByTestId("sync-status-dot");
      expect(dot).toBeInTheDocument();
      expect(dot.className).toContain("bg-red-500");
    });
  });

  it("shows blue pulsing dot when sync is running", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        syncRun: { id: 1, status: "running", prCount: 5, commentCount: 0, startedAt: "2024-06-01T10:00:00Z", completedAt: null, errorMessage: null },
        history: [],
      }),
    });

    renderSidebar();

    await waitFor(() => {
      const dot = screen.getByTestId("sync-status-dot");
      expect(dot).toBeInTheDocument();
      expect(dot.className).toContain("bg-blue-500");
      expect(dot.className).toContain("animate-pulse");
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
