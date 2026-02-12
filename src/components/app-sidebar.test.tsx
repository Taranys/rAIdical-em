// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SidebarProvider } from "@/components/ui/sidebar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

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
    vi.mocked(usePathname).mockReturnValue("/");
  });

  it("renders the app title", () => {
    renderSidebar();
    expect(screen.getByText("em-control-tower")).toBeInTheDocument();
  });

  it("renders all three navigation links", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Team/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Settings/i })).toBeInTheDocument();
  });

  it("links point to correct URLs", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Team/i })).toHaveAttribute("href", "/team");
    expect(screen.getByRole("link", { name: /Settings/i })).toHaveAttribute("href", "/settings");
  });

  it("highlights Dashboard when pathname is /", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    renderSidebar();

    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("link", { name: /Team/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Settings/i })).toHaveAttribute("data-active", "false");
  });

  it("highlights Team when pathname is /team", () => {
    vi.mocked(usePathname).mockReturnValue("/team");
    renderSidebar();

    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Team/i })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("link", { name: /Settings/i })).toHaveAttribute("data-active", "false");
  });

  it("highlights Settings when pathname is /settings", () => {
    vi.mocked(usePathname).mockReturnValue("/settings");
    renderSidebar();

    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Team/i })).toHaveAttribute("data-active", "false");
    expect(screen.getByRole("link", { name: /Settings/i })).toHaveAttribute("data-active", "true");
  });
});
