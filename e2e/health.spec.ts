import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("displays the dashboard heading", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible();
  });
});

test.describe("Health API", () => {
  test("returns a healthy status with database info", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.ok()).toBe(true);

    const body = await response.json();

    expect(body.status).toBe("healthy");
    expect(body.timestamp).toBeDefined();
    expect(body.services.database.connected).toBe(true);
    expect(body.services.database.sqliteVersion).toBeDefined();
  });
});
