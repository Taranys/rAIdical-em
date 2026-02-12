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

    // Generate PAT link
    const patLink = page.getByRole("link", {
      name: /generate a fine-grained pat/i,
    });
    await expect(patLink).toBeVisible();
    await expect(patLink).toHaveAttribute(
      "href",
      "https://github.com/settings/personal-access-tokens/new",
    );

    // Required permissions info
    await expect(page.getByText(/Pull requests/)).toBeVisible();
    await expect(page.getByText(/Contents/)).toBeVisible();
    await expect(page.getByText(/Metadata/)).toBeVisible();

    // Save and Test Connection buttons
    await expect(page.getByRole("button", { name: /save/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /test connection/i }),
    ).toBeVisible();
  });

  test("dashboard shows setup CTA when no PAT configured", async ({
    page,
  }) => {
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
