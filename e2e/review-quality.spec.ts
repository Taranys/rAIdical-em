// US-2.07: Review Quality page E2E tests
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
      page.getByRole("heading", { name: "Category Distribution" }),
    ).toBeVisible();

    // Filters card is visible
    await expect(
      page.getByRole("heading", { name: "Filters" }),
    ).toBeVisible();

    // Comments table card is visible
    await expect(
      page.getByRole("heading", { name: "Classified Comments" }),
    ).toBeVisible();
  });
});
