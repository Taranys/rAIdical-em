// US-010: Sync page E2E tests
import { test, expect } from "@playwright/test";

test.describe("Sync Page", () => {
  test("navigates to sync page and displays initial state", async ({
    page,
  }) => {
    await page.goto("/sync");

    // Page title visible
    await expect(
      page.getByRole("heading", { name: "Sync" }),
    ).toBeVisible();

    // Sync card visible
    await expect(page.getByText("GitHub Pull Requests")).toBeVisible();

    // Sync button visible
    await expect(
      page.getByRole("button", { name: /sync now/i }),
    ).toBeVisible();

    // Rate limit card visible
    await expect(page.getByText("GitHub API Rate Limit")).toBeVisible();
  });

  test("sidebar highlights Sync when on sync page", async ({ page }) => {
    await page.goto("/sync");

    const sidebar = page.locator("[data-slot='sidebar']");
    await expect(
      sidebar.getByRole("link", { name: "Sync" }),
    ).toHaveAttribute("data-active", "true");
  });
});
