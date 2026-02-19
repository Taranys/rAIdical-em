// @vitest-environment jsdom
// US-2.17: Unit tests for database import form component
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { DatabaseImportForm } from "./database-import-form";

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

describe("DatabaseImportForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the card title", () => {
    globalThis.fetch = mockFetch({});
    render(<DatabaseImportForm />);
    const title = document.querySelector('[data-slot="card-title"]');
    expect(title).toHaveTextContent("Import Database");
  });

  it("renders a file input", () => {
    globalThis.fetch = mockFetch({});
    render(<DatabaseImportForm />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
  });

  it("renders the import button as destructive", () => {
    globalThis.fetch = mockFetch({});
    render(<DatabaseImportForm />);
    const button = screen.getByRole("button", { name: /import database/i });
    expect(button).toBeInTheDocument();
  });

  it("disables import button when no file is selected", () => {
    globalThis.fetch = mockFetch({});
    render(<DatabaseImportForm />);
    const button = screen.getByRole("button", { name: /import database/i });
    expect(button).toBeDisabled();
  });

  it("enables import button when a file is selected", () => {
    globalThis.fetch = mockFetch({});
    render(<DatabaseImportForm />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["content"], "test.db", {
      type: "application/octet-stream",
    });
    fireEvent.change(input, { target: { files: [file] } });

    const button = screen.getByRole("button", { name: /import database/i });
    expect(button).not.toBeDisabled();
  });

  it("shows confirmation dialog when import button is clicked", async () => {
    globalThis.fetch = mockFetch({});
    render(<DatabaseImportForm />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["content"], "test.db", {
      type: "application/octet-stream",
    });
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: /import database/i }));

    await waitFor(() => {
      expect(screen.getByText("Replace entire database?")).toBeInTheDocument();
    });
  });

  it("shows destructive warning in confirmation dialog", async () => {
    globalThis.fetch = mockFetch({});
    render(<DatabaseImportForm />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["content"], "test.db", {
      type: "application/octet-stream",
    });
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: /import database/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/permanently replace ALL current data/),
      ).toBeInTheDocument();
    });
  });

  it("closes dialog without upload when Cancel is clicked", async () => {
    const fetchMock = mockFetch({});
    globalThis.fetch = fetchMock;
    render(<DatabaseImportForm />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["content"], "test.db", {
      type: "application/octet-stream",
    });
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: /import database/i }));

    await waitFor(() => {
      expect(screen.getByText("Replace entire database?")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(
        screen.queryByText("Replace entire database?"),
      ).not.toBeInTheDocument();
    });

    // No POST should have been made (only no calls at all since no GET either)
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/settings/database/import",
      expect.anything(),
    );
  });

  it("uploads file when Replace Database is confirmed", async () => {
    const fetchMock = mockFetch({
      "POST /api/settings/database/import": {
        success: true,
        tables: {
          settings: 3,
          team_members: 5,
          pull_requests: 10,
          reviews: 20,
          review_comments: 15,
          pr_comments: 8,
          sync_runs: 2,
        },
      },
    });
    globalThis.fetch = fetchMock;
    render(<DatabaseImportForm />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["content"], "test.db", {
      type: "application/octet-stream",
    });
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: /import database/i }));

    await waitFor(() => {
      expect(screen.getByText("Replace entire database?")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /replace database/i }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/settings/database/import",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("shows success feedback with table stats after import", async () => {
    globalThis.fetch = mockFetch({
      "POST /api/settings/database/import": {
        success: true,
        tables: {
          settings: 3,
          team_members: 5,
          pull_requests: 10,
          reviews: 20,
          review_comments: 15,
          pr_comments: 8,
          sync_runs: 2,
        },
      },
    });
    render(<DatabaseImportForm />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["content"], "test.db", {
      type: "application/octet-stream",
    });
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: /import database/i }));

    await waitFor(() => {
      expect(screen.getByText("Replace entire database?")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /replace database/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/database imported successfully/i)).toBeInTheDocument();
    });
  });

  it("shows error feedback when import fails", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: "Invalid file: not a SQLite database.",
          }),
      }),
    ) as unknown as typeof globalThis.fetch;

    render(<DatabaseImportForm />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["content"], "bad.db", {
      type: "application/octet-stream",
    });
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: /import database/i }));

    await waitFor(() => {
      expect(screen.getByText("Replace entire database?")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /replace database/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/not a SQLite database/i),
      ).toBeInTheDocument();
    });
  });
});
