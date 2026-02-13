// @vitest-environment jsdom
// US-024: Unit tests for ImportGitHubSheet component
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { ImportGitHubSheet } from "./import-github-sheet";

function mockFetchResponses(responses: Record<string, { body: unknown; status?: number }>) {
  return vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    // Match by prefix for GET requests with query params
    const matchingKey = Object.keys(responses).find((key) => {
      const [keyMethod, keyUrl] = key.split(" ", 2);
      return method === keyMethod && url.startsWith(keyUrl);
    });
    const match = matchingKey ? responses[matchingKey] : undefined;
    const body = match?.body ?? {};
    const status = match?.status ?? 200;
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    });
  }) as unknown as typeof globalThis.fetch;
}

describe("ImportGitHubSheet", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    existingMembers: ["existing-user"],
    onImportComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the sheet title", () => {
    globalThis.fetch = mockFetchResponses({});
    render(<ImportGitHubSheet {...defaultProps} />);
    expect(screen.getByText("Import from GitHub")).toBeInTheDocument();
  });

  it("renders mode toggle buttons", () => {
    globalThis.fetch = mockFetchResponses({});
    render(<ImportGitHubSheet {...defaultProps} />);
    expect(screen.getByRole("button", { name: /search users/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /browse organization/i })).toBeInTheDocument();
  });

  it("renders search input in search mode by default", () => {
    globalThis.fetch = mockFetchResponses({});
    render(<ImportGitHubSheet {...defaultProps} />);
    expect(screen.getByPlaceholderText(/search github/i)).toBeInTheDocument();
  });

  it("triggers debounced search on input", async () => {
    const fetchMock = mockFetchResponses({
      "GET /api/team/github-search": {
        body: {
          users: [
            { login: "octocat", name: "The Octocat", avatarUrl: "https://avatars.example.com/1" },
          ],
          rateLimit: { remaining: 28, reset: 1700000000 },
        },
      },
    });
    globalThis.fetch = fetchMock;

    render(<ImportGitHubSheet {...defaultProps} />);
    const input = screen.getByPlaceholderText(/search github/i);

    await act(async () => {
      fireEvent.change(input, { target: { value: "octo" } });
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/team/github-search?q=octo"),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("octocat")).toBeInTheDocument();
    });
  });

  it("marks existing members with 'Already added' badge", async () => {
    const fetchMock = mockFetchResponses({
      "GET /api/team/github-search": {
        body: {
          users: [
            { login: "existing-user", name: "Existing", avatarUrl: "https://avatars.example.com/1" },
            { login: "new-user", name: "New User", avatarUrl: "https://avatars.example.com/2" },
          ],
          rateLimit: { remaining: 28, reset: 1700000000 },
        },
      },
    });
    globalThis.fetch = fetchMock;

    render(<ImportGitHubSheet {...defaultProps} />);

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/search github/i), {
        target: { value: "user" },
      });
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(screen.getByText("Already added")).toBeInTheDocument();
    });
  });

  it("allows selecting and deselecting users", async () => {
    const fetchMock = mockFetchResponses({
      "GET /api/team/github-search": {
        body: {
          users: [
            { login: "new-user", name: "New User", avatarUrl: "https://avatars.example.com/1" },
          ],
          rateLimit: { remaining: 28, reset: 1700000000 },
        },
      },
    });
    globalThis.fetch = fetchMock;

    render(<ImportGitHubSheet {...defaultProps} />);

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/search github/i), {
        target: { value: "new" },
      });
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(screen.getByText("new-user")).toBeInTheDocument();
    });

    // Click checkbox to select
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(screen.getByText(/1 selected/i)).toBeInTheDocument();

    // Click again to deselect
    fireEvent.click(checkbox);
    expect(screen.queryByText(/1 selected/i)).not.toBeInTheDocument();
  });

  it("import button is disabled when nothing selected", async () => {
    globalThis.fetch = mockFetchResponses({});
    render(<ImportGitHubSheet {...defaultProps} />);

    const importButton = screen.getByRole("button", { name: /import/i });
    expect(importButton).toBeDisabled();
  });

  it("imports selected users and shows results", async () => {
    const fetchMock = mockFetchResponses({
      "GET /api/team/github-search": {
        body: {
          users: [
            { login: "new-user", name: "New User", avatarUrl: "https://avatars.example.com/1" },
          ],
          rateLimit: { remaining: 28, reset: 1700000000 },
        },
      },
      "POST /api/team": {
        body: {
          member: {
            id: 1,
            githubUsername: "new-user",
            displayName: "New User",
            avatarUrl: "https://avatars.example.com/1",
          },
        },
        status: 201,
      },
    });
    globalThis.fetch = fetchMock;

    render(<ImportGitHubSheet {...defaultProps} />);

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/search github/i), {
        target: { value: "new" },
      });
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(screen.getByText("new-user")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("checkbox"));

    const importButton = screen.getByRole("button", { name: /import/i });
    expect(importButton).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(importButton);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "new-user" }),
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Imported")).toBeInTheDocument();
    });

    expect(defaultProps.onImportComplete).toHaveBeenCalled();
  });

  it("shows error badge when import fails", async () => {
    const fetchMock = mockFetchResponses({
      "GET /api/team/github-search": {
        body: {
          users: [
            { login: "bad-user", name: "Bad User", avatarUrl: "https://avatars.example.com/1" },
          ],
          rateLimit: { remaining: 28, reset: 1700000000 },
        },
      },
      "POST /api/team": {
        body: { error: "Server error" },
        status: 500,
      },
    });
    globalThis.fetch = fetchMock;

    render(<ImportGitHubSheet {...defaultProps} />);

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/search github/i), {
        target: { value: "bad" },
      });
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(screen.getByText("bad-user")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("checkbox"));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /import/i }));
    });

    await waitFor(() => {
      expect(screen.getByText("Error")).toBeInTheDocument();
    });
  });

  it("switches to browse organization mode", async () => {
    const fetchMock = mockFetchResponses({
      "GET /api/settings/github-owners": {
        body: {
          owners: [
            { login: "myuser", type: "user" },
            { login: "my-org", type: "org" },
          ],
        },
      },
    });
    globalThis.fetch = fetchMock;

    render(<ImportGitHubSheet {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /browse organization/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/select an organization/i)).toBeInTheDocument();
    });
  });

  it("displays rate limit info", async () => {
    const fetchMock = mockFetchResponses({
      "GET /api/team/github-search": {
        body: {
          users: [],
          rateLimit: { remaining: 5, reset: 1700000000 },
        },
      },
    });
    globalThis.fetch = fetchMock;

    render(<ImportGitHubSheet {...defaultProps} />);

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/search github/i), {
        target: { value: "test" },
      });
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(screen.getByText(/5 requests remaining/i)).toBeInTheDocument();
    });
  });
});
