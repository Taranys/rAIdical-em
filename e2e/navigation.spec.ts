// US-023: Application shell and navigation E2E tests
import { test, expect } from "@playwright/test";

test.describe("Application Shell and Navigation", () => {
  test("sidebar displays app title and navigation links", async ({ page }) => {
    await page.goto("/");

    // App title visible in sidebar
    const sidebar = page.locator("[data-slot='sidebar']");
    await expect(sidebar.getByText("em-control-tower")).toBeVisible();

    // All three navigation links present
    await expect(sidebar.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Team" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Settings" })).toBeVisible();
  });

  test("highlights current page in sidebar", async ({ page }) => {
    await page.goto("/");

    const sidebar = page.locator("[data-slot='sidebar']");
    const dashboardLink = sidebar.getByRole("link", { name: "Dashboard" });
    await expect(dashboardLink).toHaveAttribute("data-active", "true");
  });

  test("navigates between pages using sidebar links", async ({ page }) => {
    await page.goto("/");

    const sidebar = page.locator("[data-slot='sidebar']");

    // Navigate to Team page
    await sidebar.getByRole("link", { name: "Team" }).click();
    await expect(page).toHaveURL("/team");
    await expect(page.getByRole("heading", { name: "Team" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Team" })).toHaveAttribute("data-active", "true");

    // Navigate to Settings page
    await sidebar.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Settings" })).toHaveAttribute("data-active", "true");

    // Navigate back to Dashboard
    await sidebar.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "em-control-tower" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Dashboard" })).toHaveAttribute("data-active", "true");
  });
});
