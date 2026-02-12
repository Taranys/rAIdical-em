// US-005, US-006: GitHub PAT and repository configuration E2E tests
import { test, expect } from "@playwright/test";

test.describe("GitHub PAT Configuration", () => {
  test("settings page shows PAT form with required elements", async ({
    page,
  }) => {
    await page.goto("/settings");

    // Page heading
    await expect(
      page.getByRole("heading", { name: "Settings" }),
    ).toBeVisible();

    // PAT card heading
    await expect(
      page.getByText("GitHub Personal Access Token"),
    ).toBeVisible();

    // PAT input (password field)
    await expect(page.locator("input[type='password']")).toBeVisible();

    // Generate classic PAT link (primary)
    const classicLink = page.getByRole("link", {
      name: /generate a classic pat/i,
    });
    await expect(classicLink).toBeVisible();
    await expect(classicLink).toHaveAttribute(
      "href",
      "https://github.com/settings/tokens/new?scopes=repo",
    );

    // Fine-grained PAT link (alternative)
    const fineGrainedLink = page.getByRole("link", {
      name: /fine-grained pat/i,
    });
    await expect(fineGrainedLink).toBeVisible();

    // Save button always visible
    await expect(page.getByRole("button", { name: /save/i })).toBeVisible();
  });

  test("dashboard shows setup CTA when no PAT configured", async ({
    page,
    request,
  }) => {
    // Ensure no PAT is stored before testing the CTA
    await request.delete("/api/settings/github-pat");

    await page.goto("/");

    // CTA card visible
    await expect(page.getByText("GitHub Connection Required")).toBeVisible();

    // Link to settings
    const ctaLink = page.getByRole("link", {
      name: /configure github pat/i,
    });
    await expect(ctaLink).toBeVisible();

    // Clicking navigates to settings
    await ctaLink.click();
    await expect(page).toHaveURL("/settings");
  });
});

// US-006: GitHub Repository Configuration E2E tests
test.describe("GitHub Repository Configuration", () => {
  test("settings page shows repository form with heading", async ({
    page,
  }) => {
    await page.goto("/settings");

    await expect(page.getByText("Target Repository")).toBeVisible();
  });

  test("repository form shows PAT required message when no PAT configured", async ({
    page,
    request,
  }) => {
    // Ensure no PAT is stored
    await request.delete("/api/settings/github-pat");

    await page.goto("/settings");

    await expect(
      page.getByText(/configure a github pat above/i),
    ).toBeVisible();
  });

  test("repository form shows owner and repo fields when PAT is configured", async ({
    page,
    request,
  }) => {
    // Configure a PAT first
    await request.put("/api/settings/github-pat", {
      data: { token: "ghp_test_token_for_e2e" },
    });

    await page.goto("/settings");

    // Owner and repo fields should be visible
    await expect(page.getByLabel(/owner/i)).toBeVisible();
    await expect(page.getByLabel(/repository/i)).toBeVisible();

    // Verify and Save buttons
    await expect(
      page.getByRole("button", { name: /verify/i }),
    ).toBeVisible();

    // Clean up
    await request.delete("/api/settings/github-pat");
  });
});

// US-020: AI Detection Rules E2E tests
test.describe("AI Detection Rules", () => {
  test("settings page shows AI heuristics form with heading and default values", async ({
    page,
    request,
  }) => {
    // Ensure clean state
    await request.delete("/api/settings/ai-heuristics");

    await page.goto("/settings");

    // Card heading visible
    await expect(page.getByText("AI Detection Rules")).toBeVisible();

    // Default patterns loaded
    await expect(page.getByLabel(/co-author patterns/i)).toHaveValue(
      /Claude/,
    );
    await expect(page.getByLabel(/bot usernames/i)).toHaveValue(/dependabot/);
    await expect(page.getByLabel(/branch name patterns/i)).toHaveValue(/ai/);
    await expect(page.getByLabel(/github labels/i)).toHaveValue(
      /ai-generated/,
    );
  });

  test("can save custom heuristics configuration", async ({
    page,
    request,
  }) => {
    // Ensure clean state
    await request.delete("/api/settings/ai-heuristics");

    await page.goto("/settings");

    // Wait for form to load
    await expect(page.getByLabel(/co-author patterns/i)).toBeVisible();

    // Edit a pattern
    const coAuthorInput = page.getByLabel(/co-author patterns/i);
    await coAuthorInput.clear();
    await coAuthorInput.fill("*MyCustomBot*");

    // Click Save (specifically the one in the AI Detection Rules section)
    const aiCard = page.locator("text=AI Detection Rules").locator("..");
    const saveButton = aiCard
      .locator("..")
      .locator("..")
      .getByRole("button", { name: /^save$/i });
    await saveButton.click();

    // Verify success message
    await expect(page.getByText(/configuration saved/i)).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByLabel(/co-author patterns/i)).toHaveValue(
      "*MyCustomBot*",
    );

    // Clean up
    await request.delete("/api/settings/ai-heuristics");
  });
});
