// @vitest-environment jsdom
// US-007, US-008, US-024: Unit tests for team page
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

  // US-009: Table column headers
  it("renders table column headers when members exist", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/team": {
        members: [
          {
            id: 1,
            githubUsername: "octocat",
            displayName: "The Octocat",
            avatarUrl: null,
            isActive: 1,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      },
    });
    render(<TeamPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("columnheader", { name: "Member" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "GitHub Username" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Date Added" }),
      ).toBeInTheDocument();
    });
  });

  // US-009: Date added display
  it("displays date added for team members", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/team": {
        members: [
          {
            id: 1,
            githubUsername: "octocat",
            displayName: "The Octocat",
            avatarUrl: "https://avatars.githubusercontent.com/u/583231",
            isActive: 1,
            createdAt: "2024-01-15T10:30:00Z",
            updatedAt: "2024-01-15T10:30:00Z",
          },
        ],
      },
    });
    render(<TeamPage />);
    await waitFor(() => {
      expect(screen.getByText("Jan 15, 2024")).toBeInTheDocument();
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

  // US-008: Remove team member tests
  it("displays a remove button for each team member", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/team": {
        members: [
          {
            id: 1,
            githubUsername: "octocat",
            displayName: "The Octocat",
            avatarUrl: null,
            isActive: 1,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
          {
            id: 2,
            githubUsername: "user2",
            displayName: "User Two",
            avatarUrl: null,
            isActive: 1,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      },
    });
    render(<TeamPage />);

    await waitFor(() => {
      const removeButtons = screen.getAllByRole("button", { name: /remove/i });
      expect(removeButtons).toHaveLength(2);
    });
  });

  it("shows confirmation dialog when remove is clicked", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/team": {
        members: [
          {
            id: 1,
            githubUsername: "octocat",
            displayName: "The Octocat",
            avatarUrl: null,
            isActive: 1,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      },
    });
    render(<TeamPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));

    await waitFor(() => {
      expect(screen.getByText(/remove team member\?/i)).toBeInTheDocument();
      expect(screen.getByText(/historical data will be preserved/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });
  });

  it("calls DELETE API and shows success feedback after confirming removal", async () => {
    const fetchMock = mockFetch({
      "GET /api/team": {
        members: [
          {
            id: 1,
            githubUsername: "octocat",
            displayName: "The Octocat",
            avatarUrl: null,
            isActive: 1,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      },
      "DELETE /api/team/1": { message: "Team member removed successfully" },
    });
    globalThis.fetch = fetchMock;

    render(<TeamPage />);

    // Wait for member to appear, then click the trigger Remove button
    await waitFor(() => {
      expect(screen.getByText("The Octocat")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^remove$/i }));

    // Wait for the dialog to open and find the confirm button
    await waitFor(() => {
      expect(screen.getByText(/remove team member\?/i)).toBeInTheDocument();
    });

    // The dialog action button is the last "Remove" button in the DOM
    const allRemoveButtons = screen.getAllByRole("button", { name: /remove/i });
    fireEvent.click(allRemoveButtons[allRemoveButtons.length - 1]);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/team/1", {
        method: "DELETE",
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/successfully removed/i)).toBeInTheDocument();
    });
  });

  // US-024: Import from GitHub button
  it("renders the Import from GitHub button", () => {
    globalThis.fetch = mockFetch({});
    render(<TeamPage />);
    expect(
      screen.getByRole("button", { name: /import from github/i }),
    ).toBeInTheDocument();
  });

  it("shows error feedback when removal fails", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/team": {
        members: [
          {
            id: 1,
            githubUsername: "octocat",
            displayName: "The Octocat",
            avatarUrl: null,
            isActive: 1,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      },
      "DELETE /api/team/1": { error: "Team member not found" },
      "DELETE /api/team/1:status": 404,
    });
    render(<TeamPage />);

    await waitFor(() => {
      expect(screen.getByText("The Octocat")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^remove$/i }));

    await waitFor(() => {
      expect(screen.getByText(/remove team member\?/i)).toBeInTheDocument();
    });

    const allRemoveButtons = screen.getAllByRole("button", { name: /remove/i });
    fireEvent.click(allRemoveButtons[allRemoveButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });
});
