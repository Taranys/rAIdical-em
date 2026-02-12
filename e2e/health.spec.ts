import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("displays the application title and status cards", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "em-control-tower" })
    ).toBeVisible();

    // Verify tech stack cards are rendered
    await expect(page.getByText("App Router + Server Components")).toBeVisible();
    await expect(page.getByText("Utility-first CSS framework")).toBeVisible();
    await expect(page.getByText("Accessible component library")).toBeVisible();
    await expect(page.getByText("Strict type checking enabled")).toBeVisible();

    // Verify phase indicator
    await expect(
      page.getByText("Phase 0 — Project skeleton. All technical bricks verified.")
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
