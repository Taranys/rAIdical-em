// US-007, US-024: E2E test for team member management
import { test, expect } from "@playwright/test";

test.describe("Team page", () => {
  test("displays team page with add member form", async ({ page }) => {
    await page.goto("/team");

    await expect(
      page.getByRole("heading", { name: "Team Members" }),
    ).toBeVisible();

    await expect(page.getByLabel("GitHub Username")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /add member/i }),
    ).toBeVisible();

    await expect(
      page.getByText(/all registered team members/i),
    ).toBeVisible();
  });

  test("shows empty state when no members", async ({ page }) => {
    await page.goto("/team");

    await expect(page.getByText(/no team members yet/i)).toBeVisible();
  });

  test("add member button is disabled when input is empty", async ({
    page,
  }) => {
    await page.goto("/team");

    const button = page.getByRole("button", { name: /add member/i });
    await expect(button).toBeDisabled();
  });

  // US-024: Import from GitHub
  test("displays Import from GitHub button", async ({ page }) => {
    await page.goto("/team");

    await expect(
      page.getByRole("button", { name: /import from github/i }),
    ).toBeVisible();
  });

  test("opens import sheet when clicking Import from GitHub", async ({
    page,
  }) => {
    await page.goto("/team");

    await page.getByRole("button", { name: /import from github/i }).click();

    await expect(
      page.getByRole("heading", { name: "Import from GitHub" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /search users/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /browse organization/i }),
    ).toBeVisible();
  });
});
