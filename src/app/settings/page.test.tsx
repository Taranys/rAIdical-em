// @vitest-environment jsdom
// Tests for settings page card status colors
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// Mock sidebar status context
const mockRefresh = vi.fn().mockResolvedValue(undefined);
vi.mock("@/contexts/sidebar-status-context", () => ({
  useSidebarStatusContext: () => ({
    status: { settings: { configured: false }, team: { configured: false }, sync: { hasRun: false, status: null } },
    refresh: mockRefresh,
  }),
}));

import SettingsPage from "./page";

function mockFetch(responses: Record<string, unknown>) {
  return vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const key = `${method} ${url}`;
    const body = responses[key];
    if (body !== undefined) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(body),
      });
    }
    // Default responses for different endpoints
    if (url === "/api/settings/github-pat") return Promise.resolve({ ok: true, json: () => Promise.resolve({ configured: false }) });
    if (url === "/api/repositories") return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    if (url === "/api/settings/llm-provider") return Promise.resolve({ ok: true, json: () => Promise.resolve({ configured: false }) });
    if (url === "/api/settings/auto-classify") return Promise.resolve({ ok: true, json: () => Promise.resolve({ enabled: true }) });
    if (url === "/api/settings/ai-heuristics") return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  }) as unknown as typeof globalThis.fetch;
}

describe("SettingsPage card status colors", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows orange background on GitHub PAT card when not configured", async () => {
    globalThis.fetch = mockFetch({});
    const { container } = render(<SettingsPage />);

    await waitFor(() => {
      const patCard = container.querySelector(".bg-orange-50");
      expect(patCard).toBeInTheDocument();
    });
  });

  it("shows green background on GitHub PAT card when configured", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/settings/github-pat": { configured: true },
    });
    const { container } = render(<SettingsPage />);

    await waitFor(() => {
      const greenCards = container.querySelectorAll(".bg-green-50");
      expect(greenCards.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows orange background on Repositories card when no repos", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/repositories": [],
    });
    const { container } = render(<SettingsPage />);

    await waitFor(() => {
      const orangeCards = container.querySelectorAll(".bg-orange-50");
      // At least PAT + Repos should be orange
      expect(orangeCards.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows green background on Repositories card when repos exist", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/settings/github-pat": { configured: true },
      "GET /api/repositories": [{ id: 1, owner: "org", name: "repo", addedAt: "2024-01-01" }],
    });
    const { container } = render(<SettingsPage />);

    await waitFor(() => {
      const greenCards = container.querySelectorAll(".bg-green-50");
      // PAT + Repos should be green
      expect(greenCards.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows orange background on LLM card when not configured", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/settings/llm-provider": { configured: false },
    });
    const { container } = render(<SettingsPage />);

    await waitFor(() => {
      const orangeCards = container.querySelectorAll(".bg-orange-50");
      // PAT + Repos + LLM should be orange
      expect(orangeCards.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("shows green background on LLM card when configured", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/settings/github-pat": { configured: true },
      "GET /api/repositories": [{ id: 1, owner: "org", name: "repo", addedAt: "2024-01-01" }],
      "GET /api/settings/llm-provider": { configured: true, provider: "anthropic", model: "claude-3" },
    });
    const { container } = render(<SettingsPage />);

    await waitFor(() => {
      const greenCards = container.querySelectorAll(".bg-green-50");
      // All 3 config cards should be green
      expect(greenCards.length).toBe(3);
    });
  });

  it("does not apply status colors to database cards", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/settings/github-pat": { configured: true },
      "GET /api/repositories": [{ id: 1, owner: "org", name: "repo", addedAt: "2024-01-01" }],
      "GET /api/settings/llm-provider": { configured: true, provider: "anthropic", model: "claude-3" },
    });
    const { container } = render(<SettingsPage />);

    await waitFor(() => {
      const greenCards = container.querySelectorAll(".bg-green-50");
      // Exactly 3 green cards (PAT, Repos, LLM) — not 5
      expect(greenCards.length).toBe(3);
    });
  });

  it("updates PAT card from orange to green when PAT is saved", async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn((url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (url === "/api/settings/github-pat" && method === "GET") {
        callCount++;
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ configured: callCount > 1 }) });
      }
      if (url === "/api/settings/github-pat" && method === "PUT") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
      }
      if (url === "/api/repositories") return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      if (url === "/api/settings/llm-provider") return Promise.resolve({ ok: true, json: () => Promise.resolve({ configured: false }) });
      if (url === "/api/settings/auto-classify") return Promise.resolve({ ok: true, json: () => Promise.resolve({ enabled: true }) });
      if (url === "/api/settings/ai-heuristics") return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }) as unknown as typeof globalThis.fetch;

    const { container } = render(<SettingsPage />);

    // Initially orange
    await waitFor(() => {
      expect(container.querySelector(".bg-orange-50")).toBeInTheDocument();
    });

    // Type a token and save (use first Save button — belongs to PAT form)
    const input = screen.getByPlaceholderText("ghp_...");
    fireEvent.change(input, { target: { value: "ghp_test123" } });
    const saveButtons = screen.getAllByRole("button", { name: /save/i });
    fireEvent.click(saveButtons[0]);

    // PAT card should now be green
    await waitFor(() => {
      const allCards = container.querySelectorAll("[class*='bg-green-50']");
      expect(allCards.length).toBeGreaterThanOrEqual(1);
    });
  });
});
