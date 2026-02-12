// US-005: GitHub PAT configuration E2E tests
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
