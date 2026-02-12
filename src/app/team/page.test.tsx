// @vitest-environment jsdom
// US-007: Unit tests for team page
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import TeamPage from "./page";

function mockFetch(responses: Record<string, unknown>) {
  return vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const key = `${method} ${url}`;
    const body = responses[key] ?? { members: [] };
    const status = (responses[`${key}:status`] as number) ?? 200;
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    });
  }) as unknown as typeof globalThis.fetch;
}

describe("TeamPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the page heading", () => {
    globalThis.fetch = mockFetch({});
    render(<TeamPage />);
    expect(screen.getByText("Team Members")).toBeInTheDocument();
  });

  it("renders the add member form", () => {
    globalThis.fetch = mockFetch({});
    render(<TeamPage />);
    expect(screen.getByPlaceholderText("octocat")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add member/i }),
    ).toBeInTheDocument();
  });

  it("disables submit button when input is empty", () => {
    globalThis.fetch = mockFetch({});
    render(<TeamPage />);
    const button = screen.getByRole("button", { name: /add member/i });
    expect(button).toBeDisabled();
  });

  it("displays empty state when no members", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/team": { members: [] },
    });
    render(<TeamPage />);
    await waitFor(() => {
      expect(screen.getByText(/no team members yet/i)).toBeInTheDocument();
    });
  });

  it("displays team members when they exist", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/team": {
        members: [
          {
            id: 1,
            githubUsername: "octocat",
            displayName: "The Octocat",
            avatarUrl: "https://avatars.githubusercontent.com/u/583231",
            isActive: 1,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      },
    });
    render(<TeamPage />);
    await waitFor(() => {
      expect(screen.getByText("The Octocat")).toBeInTheDocument();
      expect(screen.getByText("@octocat")).toBeInTheDocument();
    });
  });

  it("submits username and calls POST /api/team", async () => {
    const fetchMock = mockFetch({
      "GET /api/team": { members: [] },
      "POST /api/team": {
        member: {
          id: 1,
          githubUsername: "newuser",
          displayName: "New User",
          avatarUrl: null,
          isActive: 1,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      },
    });
    globalThis.fetch = fetchMock;

    render(<TeamPage />);
    const input = screen.getByPlaceholderText("octocat");
    fireEvent.change(input, { target: { value: "newuser" } });
    fireEvent.click(screen.getByRole("button", { name: /add member/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "newuser" }),
      });
    });
  });

  it("shows success feedback after adding member", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/team": { members: [] },
      "POST /api/team": {
        member: {
          id: 1,
          githubUsername: "newuser",
          displayName: "New User",
          avatarUrl: null,
          isActive: 1,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      },
    });
    render(<TeamPage />);

    fireEvent.change(screen.getByPlaceholderText("octocat"), {
      target: { value: "newuser" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add member/i }));

    await waitFor(() => {
      expect(screen.getByText(/successfully added/i)).toBeInTheDocument();
    });
  });

  it("clears input after successful submission", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/team": { members: [] },
      "POST /api/team": {
        member: {
          id: 1,
          githubUsername: "newuser",
          displayName: "New User",
          avatarUrl: null,
          isActive: 1,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      },
    });
    render(<TeamPage />);

    const input = screen.getByPlaceholderText("octocat") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "newuser" } });
    fireEvent.click(screen.getByRole("button", { name: /add member/i }));

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("shows error when duplicate username", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/team": { members: [] },
      "POST /api/team": { error: 'User "octocat" already exists in your team.' },
      "POST /api/team:status": 409,
    });
    render(<TeamPage />);

    fireEvent.change(screen.getByPlaceholderText("octocat"), {
      target: { value: "octocat" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add member/i }));

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });

  it("shows error when GitHub user not found", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/team": { members: [] },
      "POST /api/team": { error: 'GitHub user "nonexistent" not found.' },
      "POST /api/team:status": 404,
    });
    render(<TeamPage />);

    fireEvent.change(screen.getByPlaceholderText("octocat"), {
      target: { value: "nonexistent" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add member/i }));

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });
});
