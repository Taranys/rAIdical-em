// @vitest-environment jsdom
// US-020: Unit tests for AI heuristics configuration form
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AiHeuristicsForm } from "./ai-heuristics-form";
import { DEFAULT_AI_HEURISTICS } from "@/lib/ai-detection";

function mockFetch(responses: Record<string, unknown>) {
  return vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const key = `${method} ${url}`;
    const body = responses[key];
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(body ?? {}),
    });
  }) as unknown as typeof globalThis.fetch;
}

const DEFAULT_RESPONSE = {
  "GET /api/settings/ai-heuristics": {
    configured: false,
    config: DEFAULT_AI_HEURISTICS,
  },
};

describe("AiHeuristicsForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders card title", async () => {
    globalThis.fetch = mockFetch(DEFAULT_RESPONSE);
    render(<AiHeuristicsForm />);
    expect(screen.getByText("AI Detection Rules")).toBeInTheDocument();
  });

  it("loads and displays default co-author patterns", async () => {
    globalThis.fetch = mockFetch(DEFAULT_RESPONSE);
    render(<AiHeuristicsForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/co-author patterns/i)).toHaveValue(
        "*Claude*, *Copilot*, *[bot]*",
      );
    });
  });

  it("loads and displays default author bot list", async () => {
    globalThis.fetch = mockFetch(DEFAULT_RESPONSE);
    render(<AiHeuristicsForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/bot usernames/i)).toHaveValue(
        "dependabot, renovate, dependabot[bot], renovate[bot]",
      );
    });
  });

  it("loads and displays default branch patterns", async () => {
    globalThis.fetch = mockFetch(DEFAULT_RESPONSE);
    render(<AiHeuristicsForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/branch name patterns/i)).toHaveValue(
        "ai/*, copilot/*, claude/*",
      );
    });
  });

  it("loads and displays default labels", async () => {
    globalThis.fetch = mockFetch(DEFAULT_RESPONSE);
    render(<AiHeuristicsForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/github labels/i)).toHaveValue(
        "ai-generated, ai-assisted, bot",
      );
    });
  });

  it("shows Save and Reset buttons", async () => {
    globalThis.fetch = mockFetch(DEFAULT_RESPONSE);
    render(<AiHeuristicsForm />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /save/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /reset/i }),
      ).toBeInTheDocument();
    });
  });

  it("calls PUT on save with config", async () => {
    const fetchMock = mockFetch({
      ...DEFAULT_RESPONSE,
      "PUT /api/settings/ai-heuristics": { success: true },
    });
    globalThis.fetch = fetchMock;

    render(<AiHeuristicsForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/co-author patterns/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/settings/ai-heuristics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("coAuthorPatterns"),
      });
    });
  });

  it("shows success feedback after save", async () => {
    globalThis.fetch = mockFetch({
      ...DEFAULT_RESPONSE,
      "PUT /api/settings/ai-heuristics": { success: true },
    });

    render(<AiHeuristicsForm />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/configuration saved/i),
      ).toBeInTheDocument();
    });
  });

  it("calls DELETE on reset to defaults", async () => {
    const fetchMock = mockFetch({
      ...DEFAULT_RESPONSE,
      "DELETE /api/settings/ai-heuristics": { success: true },
    });
    globalThis.fetch = fetchMock;

    render(<AiHeuristicsForm />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /reset/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/settings/ai-heuristics", {
        method: "DELETE",
      });
    });
  });

  it("updates pattern value on input change", async () => {
    globalThis.fetch = mockFetch(DEFAULT_RESPONSE);
    render(<AiHeuristicsForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/co-author patterns/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/co-author patterns/i), {
      target: { value: "*NewBot*" },
    });

    expect(screen.getByLabelText(/co-author patterns/i)).toHaveValue(
      "*NewBot*",
    );
  });
});
