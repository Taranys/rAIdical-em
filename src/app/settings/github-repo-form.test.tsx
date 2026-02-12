// @vitest-environment jsdom
// US-006: Unit tests for GitHub repository configuration form
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { GitHubRepoForm } from "./github-repo-form";

function mockFetch(responses: Record<string, unknown>) {
  return vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    // Strip query params for matching
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

// Default responses for a configured PAT + no repo configured
const PAT_CONFIGURED = {
  "GET /api/settings/github-pat": { configured: true },
  "GET /api/settings/github-repo": { configured: false, owner: null, repo: null },
  "GET /api/settings/github-owners": OWNERS_RESPONSE,
};

// PAT configured + repo configured
const REPO_CONFIGURED = {
  "GET /api/settings/github-pat": { configured: true },
  "GET /api/settings/github-repo": {
    configured: true,
    owner: "my-org",
    repo: "my-repo",
  },
  "GET /api/settings/github-owners": OWNERS_RESPONSE,
};

describe("GitHubRepoForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the card title", async () => {
    globalThis.fetch = mockFetch(PAT_CONFIGURED);
    render(<GitHubRepoForm />);
    expect(screen.getByText("Target Repository")).toBeInTheDocument();
  });

  it("shows PAT-required message when no PAT is configured", async () => {
    globalThis.fetch = mockFetch({
      "GET /api/settings/github-pat": { configured: false },
      "GET /api/settings/github-repo": { configured: false, owner: null, repo: null },
    });
    render(<GitHubRepoForm />);

    await waitFor(() => {
      expect(
        screen.getByText(/configure a github pat above/i),
      ).toBeInTheDocument();
    });
  });

  it("shows owner and repo fields when PAT is configured", async () => {
    globalThis.fetch = mockFetch(PAT_CONFIGURED);
    render(<GitHubRepoForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/owner/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/repository/i)).toBeInTheDocument();
    });
  });

  it("disables repo input when owner is empty", async () => {
    globalThis.fetch = mockFetch(PAT_CONFIGURED);
    render(<GitHubRepoForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/repository/i)).toBeDisabled();
    });
  });

  it("enables repo input when owner has value", async () => {
    globalThis.fetch = mockFetch(PAT_CONFIGURED);
    render(<GitHubRepoForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/owner/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/owner/i), {
      target: { value: "my-org" },
    });

    expect(screen.getByLabelText(/repository/i)).not.toBeDisabled();
  });

  it("shows Verify and Save buttons when PAT is configured", async () => {
    globalThis.fetch = mockFetch(PAT_CONFIGURED);
    render(<GitHubRepoForm />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /verify/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /save/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows Delete button when repo is configured", async () => {
    globalThis.fetch = mockFetch(REPO_CONFIGURED);
    render(<GitHubRepoForm />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /delete/i }),
      ).toBeInTheDocument();
    });
  });

  it("hides Delete button when repo is not configured", async () => {
    globalThis.fetch = mockFetch(PAT_CONFIGURED);
    render(<GitHubRepoForm />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /verify/i })).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: /delete/i }),
    ).not.toBeInTheDocument();
  });

  it("calls PUT on save with owner and repo", async () => {
    const fetchMock = mockFetch({
      ...PAT_CONFIGURED,
      "PUT /api/settings/github-repo": { success: true },
    });
    globalThis.fetch = fetchMock;

    render(<GitHubRepoForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/owner/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/owner/i), {
      target: { value: "my-org" },
    });
    fireEvent.change(screen.getByLabelText(/repository/i), {
      target: { value: "my-repo" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/settings/github-repo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: "my-org", repo: "my-repo" }),
      });
    });
  });

  it("shows success feedback after saving", async () => {
    globalThis.fetch = mockFetch({
      ...PAT_CONFIGURED,
      "PUT /api/settings/github-repo": { success: true },
    });

    render(<GitHubRepoForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/owner/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/owner/i), {
      target: { value: "my-org" },
    });
    fireEvent.change(screen.getByLabelText(/repository/i), {
      target: { value: "my-repo" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/repository configuration saved/i),
      ).toBeInTheDocument();
    });
  });

  it("calls DELETE on delete", async () => {
    const fetchMock = mockFetch({
      ...REPO_CONFIGURED,
      "DELETE /api/settings/github-repo": { success: true },
    });
    globalThis.fetch = fetchMock;

    render(<GitHubRepoForm />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /delete/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/settings/github-repo", {
        method: "DELETE",
      });
    });
  });

  it("calls POST /verify on verify click", async () => {
    const fetchMock = mockFetch({
      ...PAT_CONFIGURED,
      "POST /api/settings/github-repo/verify": {
        success: true,
        repository: {
          fullName: "my-org/my-repo",
          description: "A repo",
          isPrivate: false,
          defaultBranch: "main",
        },
      },
    });
    globalThis.fetch = fetchMock;

    render(<GitHubRepoForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/owner/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/owner/i), {
      target: { value: "my-org" },
    });
    fireEvent.change(screen.getByLabelText(/repository/i), {
      target: { value: "my-repo" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/settings/github-repo/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner: "my-org", repo: "my-repo" }),
        },
      );
    });
  });

  it("shows verify result on successful verification", async () => {
    globalThis.fetch = mockFetch({
      ...PAT_CONFIGURED,
      "POST /api/settings/github-repo/verify": {
        success: true,
        repository: {
          fullName: "my-org/my-repo",
          description: "A great repo",
          isPrivate: false,
          defaultBranch: "main",
        },
      },
    });

    render(<GitHubRepoForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/owner/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/owner/i), {
      target: { value: "my-org" },
    });
    fireEvent.change(screen.getByLabelText(/repository/i), {
      target: { value: "my-repo" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(screen.getByText("my-org/my-repo")).toBeInTheDocument();
      expect(screen.getByText("(Public)")).toBeInTheDocument();
      expect(screen.getByText(/default branch: main/i)).toBeInTheDocument();
    });
  });

  it("loads existing config on mount and populates fields", async () => {
    globalThis.fetch = mockFetch(REPO_CONFIGURED);
    render(<GitHubRepoForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/owner/i)).toHaveValue("my-org");
      expect(screen.getByLabelText(/repository/i)).toHaveValue("my-repo");
    });
  });

  it("shows owner suggestions on focus when PAT is configured", async () => {
    globalThis.fetch = mockFetch(PAT_CONFIGURED);
    render(<GitHubRepoForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/owner/i)).toBeInTheDocument();
    });

    // Wait for owners to be fetched
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/settings/github-owners",
      );
    });

    // Focus the owner input to open the dropdown
    fireEvent.focus(screen.getByLabelText(/owner/i));

    await waitFor(() => {
      expect(screen.getByRole("listbox", { name: /owner suggestions/i })).toBeInTheDocument();
      expect(screen.getByText("octocat")).toBeInTheDocument();
      expect(screen.getByText("my-org")).toBeInTheDocument();
    });
  });

  it("fills owner input when clicking a suggestion", async () => {
    globalThis.fetch = mockFetch(PAT_CONFIGURED);
    render(<GitHubRepoForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/owner/i)).toBeInTheDocument();
    });

    // Wait for owners to be fetched
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/settings/github-owners",
      );
    });

    fireEvent.focus(screen.getByLabelText(/owner/i));

    await waitFor(() => {
      expect(screen.getByText("my-org")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("my-org"));

    expect(screen.getByLabelText(/owner/i)).toHaveValue("my-org");
  });
});
