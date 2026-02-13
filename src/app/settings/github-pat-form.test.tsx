// @vitest-environment jsdom
// US-005: Unit tests for GitHub PAT form component
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { GitHubPatForm } from "./github-pat-form";

function mockFetch(responses: Record<string, unknown>) {
  return vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const key = `${method} ${url}`;
    const body = responses[key] ?? { configured: false };
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(body),
    });
  }) as unknown as typeof globalThis.fetch;
}

describe("GitHubPatForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the heading", async () => {
    globalThis.fetch = mockFetch({});
    render(<GitHubPatForm />);
    expect(screen.getByText("GitHub Personal Access Token")).toBeInTheDocument();
  });

  it("renders the PAT input field as password type", async () => {
    globalThis.fetch = mockFetch({});
    render(<GitHubPatForm />);
    const input = screen.getByPlaceholderText("ghp_...");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "password");
  });

  it("renders a link to generate a classic PAT", async () => {
    globalThis.fetch = mockFetch({});
    render(<GitHubPatForm />);
    const link = screen.getByRole("link", {
      name: /generate a classic pat/i,
    });
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/settings/tokens/new?scopes=repo",
    );
  });

  it("renders a link to fine-grained PAT as alternative", async () => {
    globalThis.fetch = mockFetch({});
    render(<GitHubPatForm />);
    const link = screen.getByRole("link", {
      name: /fine-grained pat/i,
    });
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/settings/personal-access-tokens/new",
    );
  });

  it("renders Save button always", async () => {
    globalThis.fetch = mockFetch({});
    render(<GitHubPatForm />);
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("shows Test Connection and Delete buttons when PAT is configured", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/settings/github-pat": { configured: true },
    });
    render(<GitHubPatForm />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /test connection/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /delete/i }),
      ).toBeInTheDocument();
    });
  });

  it("hides Test Connection and Delete buttons when PAT is not configured", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/settings/github-pat": { configured: false },
    });
    render(<GitHubPatForm />);
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /test connection/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /delete/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("calls PUT when Save is clicked with a token", async () => {
    const fetchMock = mockFetch({
      "PUT /api/settings/github-pat": { success: true },
    });
    globalThis.fetch = fetchMock;

    render(<GitHubPatForm />);
    const input = screen.getByPlaceholderText("ghp_...");
    fireEvent.change(input, { target: { value: "ghp_test123" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/settings/github-pat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "ghp_test123" }),
      });
    });
  });

  it("shows success feedback after saving", async () => {
    globalThis.fetch = mockFetch({
      "PUT /api/settings/github-pat": { success: true },
    });
    render(<GitHubPatForm />);

    fireEvent.change(screen.getByPlaceholderText("ghp_..."), {
      target: { value: "ghp_test123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/pat saved/i)).toBeInTheDocument();
    });
  });

  it("calls POST /test when Test Connection is clicked", async () => {
    const fetchMock = mockFetch({
      "GET /api/settings/github-pat": { configured: true },
      "POST /api/settings/github-pat/test": {
        success: true,
        user: { login: "octocat", name: "Octo Cat" },
      },
    });
    globalThis.fetch = fetchMock;

    render(<GitHubPatForm />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /test connection/i }),
      ).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole("button", { name: /test connection/i }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/settings/github-pat/test",
        { method: "POST" },
      );
    });
  });

  it("shows GitHub username on successful connection test", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/settings/github-pat": { configured: true },
      "POST /api/settings/github-pat/test": {
        success: true,
        user: { login: "octocat", name: "Octo Cat" },
      },
    });
    render(<GitHubPatForm />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /test connection/i }),
      ).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole("button", { name: /test connection/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/octocat/)).toBeInTheDocument();
    });
  });

  it("shows error on failed connection test", async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn(() => {
      callCount++;
      // First call is GET /api/settings/github-pat (check configured)
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ configured: true }),
        });
      }
      // Second call is POST /api/settings/github-pat/test (fails)
      return Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: "Bad credentials",
          }),
      });
    }) as unknown as typeof globalThis.fetch;

    render(<GitHubPatForm />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /test connection/i }),
      ).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole("button", { name: /test connection/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/bad credentials/i)).toBeInTheDocument();
    });
  });

  it("calls onPatChange after saving PAT", async () => {
    const onPatChange = vi.fn();
    globalThis.fetch = mockFetch({
      "PUT /api/settings/github-pat": { success: true },
    });
    render(<GitHubPatForm onPatChange={onPatChange} />);

    fireEvent.change(screen.getByPlaceholderText("ghp_..."), {
      target: { value: "ghp_test123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(onPatChange).toHaveBeenCalledTimes(1);
    });
  });

  it("calls onPatChange after deleting PAT", async () => {
    const onPatChange = vi.fn();
    globalThis.fetch = mockFetch({
      "GET /api/settings/github-pat": { configured: true },
      "DELETE /api/settings/github-pat": { success: true },
    });
    render(<GitHubPatForm onPatChange={onPatChange} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(onPatChange).toHaveBeenCalledTimes(1);
    });
  });

  it("calls DELETE when Delete is clicked", async () => {
    const fetchMock = mockFetch({
      "GET /api/settings/github-pat": { configured: true },
      "DELETE /api/settings/github-pat": { success: true },
    });
    globalThis.fetch = fetchMock;

    render(<GitHubPatForm />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /delete/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/settings/github-pat", {
        method: "DELETE",
      });
    });
  });
});
