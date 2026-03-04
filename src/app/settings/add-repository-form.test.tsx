// @vitest-environment jsdom
// Unit tests for AddRepositoryForm with autocomplete
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { AddRepositoryForm } from "./add-repository-form";

function mockFetch(responses: Record<string, unknown>) {
  return vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const urlPath = url.split("?")[0];
    const key = `${method} ${urlPath}`;
    const body = responses[key] ?? responses[`${method} ${url}`];
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(body ?? {}),
    });
  }) as unknown as typeof globalThis.fetch;
}

const OWNERS_RESPONSE = {
  owners: [
    { login: "octocat", type: "user" },
    { login: "my-org", type: "org" },
  ],
};

const REPOS_RESPONSE = {
  repos: [
    { name: "frontend", fullName: "my-org/frontend", description: "UI app", isPrivate: false },
    { name: "backend", fullName: "my-org/backend", description: null, isPrivate: true },
  ],
};

const DEFAULT_RESPONSES = {
  "GET /api/settings/github-owners": OWNERS_RESPONSE,
  "GET /api/settings/github-repos": REPOS_RESPONSE,
};

describe("AddRepositoryForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows PAT-required message when PAT is not configured", () => {
    globalThis.fetch = mockFetch({});
    render(<AddRepositoryForm isPatConfigured={false} onAdded={vi.fn()} />);

    expect(
      screen.getByText(/configure a github pat above/i),
    ).toBeInTheDocument();
  });

  it("shows owner and repository fields when PAT is configured", () => {
    globalThis.fetch = mockFetch(DEFAULT_RESPONSES);
    render(<AddRepositoryForm isPatConfigured={true} onAdded={vi.fn()} />);

    expect(screen.getByLabelText(/owner/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/repository/i)).toBeInTheDocument();
  });

  it("fetches owners on mount when PAT is configured", async () => {
    const fetchMock = mockFetch(DEFAULT_RESPONSES);
    globalThis.fetch = fetchMock;
    render(<AddRepositoryForm isPatConfigured={true} onAdded={vi.fn()} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/settings/github-owners");
    });
  });

  it("shows owner suggestions on focus", async () => {
    globalThis.fetch = mockFetch(DEFAULT_RESPONSES);
    render(<AddRepositoryForm isPatConfigured={true} onAdded={vi.fn()} />);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/settings/github-owners");
    });

    fireEvent.focus(screen.getByLabelText(/owner/i));

    await waitFor(() => {
      expect(screen.getByRole("listbox", { name: /owner suggestions/i })).toBeInTheDocument();
      expect(screen.getByText("octocat")).toBeInTheDocument();
      expect(screen.getByText("my-org")).toBeInTheDocument();
    });
  });

  it("fills owner input when clicking a suggestion", async () => {
    globalThis.fetch = mockFetch(DEFAULT_RESPONSES);
    render(<AddRepositoryForm isPatConfigured={true} onAdded={vi.fn()} />);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/settings/github-owners");
    });

    fireEvent.focus(screen.getByLabelText(/owner/i));

    await waitFor(() => {
      expect(screen.getByText("my-org")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("my-org"));

    expect(screen.getByLabelText(/owner/i)).toHaveValue("my-org");
  });

  it("disables repository field when owner is empty", () => {
    globalThis.fetch = mockFetch(DEFAULT_RESPONSES);
    render(<AddRepositoryForm isPatConfigured={true} onAdded={vi.fn()} />);

    expect(screen.getByLabelText(/repository/i)).toBeDisabled();
  });

  it("enables repository field when owner has value", () => {
    globalThis.fetch = mockFetch(DEFAULT_RESPONSES);
    render(<AddRepositoryForm isPatConfigured={true} onAdded={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/owner/i), {
      target: { value: "my-org" },
    });

    expect(screen.getByLabelText(/repository/i)).not.toBeDisabled();
  });

  it("searches repos when typing in repository field", async () => {
    vi.useFakeTimers();
    const fetchMock = mockFetch(DEFAULT_RESPONSES);
    globalThis.fetch = fetchMock;
    render(<AddRepositoryForm isPatConfigured={true} onAdded={vi.fn()} />);

    // Need to flush the loadOwners effect
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    fireEvent.change(screen.getByLabelText(/owner/i), {
      target: { value: "my-org" },
    });

    fireEvent.change(screen.getByLabelText(/repository/i), {
      target: { value: "front" },
    });

    // Advance past the 300ms debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/settings/github-repos"),
    );

    vi.useRealTimers();
  });

  it("clears repo field and suggestions when owner changes", () => {
    globalThis.fetch = mockFetch(DEFAULT_RESPONSES);
    render(<AddRepositoryForm isPatConfigured={true} onAdded={vi.fn()} />);

    // Set owner and repo
    fireEvent.change(screen.getByLabelText(/owner/i), {
      target: { value: "my-org" },
    });
    fireEvent.change(screen.getByLabelText(/repository/i), {
      target: { value: "frontend" },
    });

    expect(screen.getByLabelText(/repository/i)).toHaveValue("frontend");

    // Change owner
    fireEvent.change(screen.getByLabelText(/owner/i), {
      target: { value: "other-org" },
    });

    // Repo should be cleared
    expect(screen.getByLabelText(/repository/i)).toHaveValue("");
  });

  it("calls POST /api/repositories on add", async () => {
    const fetchMock = mockFetch({
      ...DEFAULT_RESPONSES,
      "POST /api/repositories": { id: 1, owner: "my-org", name: "frontend", addedAt: "2026-01-01" },
    });
    globalThis.fetch = fetchMock;
    const onAdded = vi.fn();
    render(<AddRepositoryForm isPatConfigured={true} onAdded={onAdded} />);

    fireEvent.change(screen.getByLabelText(/owner/i), {
      target: { value: "my-org" },
    });
    fireEvent.change(screen.getByLabelText(/repository/i), {
      target: { value: "frontend" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add repository/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: "my-org", name: "frontend" }),
      });
    });

    await waitFor(() => {
      expect(onAdded).toHaveBeenCalled();
    });
  });

  it("shows success feedback after adding", async () => {
    globalThis.fetch = mockFetch({
      ...DEFAULT_RESPONSES,
      "POST /api/repositories": { id: 1, owner: "my-org", name: "frontend", addedAt: "2026-01-01" },
    });
    render(<AddRepositoryForm isPatConfigured={true} onAdded={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/owner/i), {
      target: { value: "my-org" },
    });
    fireEvent.change(screen.getByLabelText(/repository/i), {
      target: { value: "frontend" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add repository/i }));

    await waitFor(() => {
      expect(screen.getByText(/repository my-org\/frontend added/i)).toBeInTheDocument();
    });
  });
});
