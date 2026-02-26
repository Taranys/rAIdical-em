// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { DatabaseResetForm } from "./database-reset-form";

function mockFetch(responses: Record<string, unknown>) {
  return vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const key = `${method} ${url}`;
    const body = responses[key] ?? {};
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(body),
    });
  }) as unknown as typeof globalThis.fetch;
}

describe("DatabaseResetForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the card title", () => {
    globalThis.fetch = mockFetch({});
    render(<DatabaseResetForm />);
    const title = document.querySelector('[data-slot="card-title"]');
    expect(title).toHaveTextContent("Reset Database");
  });

  it("renders the reset button as enabled", () => {
    globalThis.fetch = mockFetch({});
    render(<DatabaseResetForm />);
    const button = screen.getByRole("button", { name: /reset database/i });
    expect(button).not.toBeDisabled();
  });

  it("shows confirmation dialog when reset button is clicked", async () => {
    globalThis.fetch = mockFetch({});
    render(<DatabaseResetForm />);

    fireEvent.click(screen.getByRole("button", { name: /reset database/i }));

    await waitFor(() => {
      expect(screen.getByText("Reset entire database?")).toBeInTheDocument();
    });
  });

  it("shows destructive warning in confirmation dialog", async () => {
    globalThis.fetch = mockFetch({});
    render(<DatabaseResetForm />);

    fireEvent.click(screen.getByRole("button", { name: /reset database/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/permanently delete ALL current data/),
      ).toBeInTheDocument();
    });
  });

  it("closes dialog without reset when Cancel is clicked", async () => {
    const fetchMock = mockFetch({});
    globalThis.fetch = fetchMock;
    render(<DatabaseResetForm />);

    fireEvent.click(screen.getByRole("button", { name: /reset database/i }));

    await waitFor(() => {
      expect(screen.getByText("Reset entire database?")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(
        screen.queryByText("Reset entire database?"),
      ).not.toBeInTheDocument();
    });

    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/settings/database/reset",
      expect.anything(),
    );
  });

  it("calls reset API when confirmed", async () => {
    const fetchMock = mockFetch({
      "POST /api/settings/database/reset": { success: true },
    });
    globalThis.fetch = fetchMock;
    render(<DatabaseResetForm />);

    fireEvent.click(screen.getByRole("button", { name: /reset database/i }));

    await waitFor(() => {
      expect(screen.getByText("Reset entire database?")).toBeInTheDocument();
    });

    // The confirmation button inside the dialog also says "Reset Database"
    const dialogButtons = screen.getAllByRole("button", { name: /reset database/i });
    fireEvent.click(dialogButtons[dialogButtons.length - 1]);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/settings/database/reset",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("shows success feedback after reset", async () => {
    globalThis.fetch = mockFetch({
      "POST /api/settings/database/reset": { success: true },
    });
    render(<DatabaseResetForm />);

    fireEvent.click(screen.getByRole("button", { name: /reset database/i }));

    await waitFor(() => {
      expect(screen.getByText("Reset entire database?")).toBeInTheDocument();
    });

    const dialogButtons = screen.getAllByRole("button", { name: /reset database/i });
    fireEvent.click(dialogButtons[dialogButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText(/database reset successfully/i)).toBeInTheDocument();
    });
  });

  it("shows error feedback when reset fails", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: "Something went wrong.",
          }),
      }),
    ) as unknown as typeof globalThis.fetch;

    render(<DatabaseResetForm />);

    fireEvent.click(screen.getByRole("button", { name: /reset database/i }));

    await waitFor(() => {
      expect(screen.getByText("Reset entire database?")).toBeInTheDocument();
    });

    const dialogButtons = screen.getAllByRole("button", { name: /reset database/i });
    fireEvent.click(dialogButtons[dialogButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});
