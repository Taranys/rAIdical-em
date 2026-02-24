// US-2.07 / US-2.08: Review Quality page E2E tests
import { test, expect } from "@playwright/test";

test.describe("Review Quality Page", () => {
  test("navigates to review quality page and displays core elements", async ({
    page,
  }) => {
    await page.goto("/");

    const sidebar = page.locator("[data-slot='sidebar']");

    // Navigate to Review Quality page
    await sidebar.getByRole("link", { name: "Review Quality" }).click();
    await expect(page).toHaveURL("/review-quality");

    // Page heading
    await expect(
      page.getByRole("heading", { name: "Review Quality" }),
    ).toBeVisible();

    // Sidebar link is active
    await expect(
      sidebar.getByRole("link", { name: "Review Quality" }),
    ).toHaveAttribute("data-active", "true");

    // Summary card is visible
    await expect(
      page.getByText("Category Distribution"),
    ).toBeVisible();

    // US-2.08: Charts dashboard section is visible
    await expect(
      page.getByText("Category Charts"),
    ).toBeVisible();

    await expect(
      page.getByText("Team-wide breakdown"),
    ).toBeVisible();

    await expect(
      page.getByText("Per-person breakdown"),
    ).toBeVisible();

    await expect(
      page.getByText("Category trend over time"),
    ).toBeVisible();

    // Filters card is visible
    await expect(
      page.getByText("Filters", { exact: true }),
    ).toBeVisible();

    // Comments table card is visible
    await expect(
      page.getByText("Classified Comments", { exact: true }),
    ).toBeVisible();
  });
});
