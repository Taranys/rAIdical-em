// Task 7.4 + 7.5: E2E tests for categories API routes and full UI flow
import { test, expect } from "@playwright/test";

test.describe("Categories API", () => {
  test.beforeEach(async ({ request }) => {
    // Reset to defaults before each test
    await request.post("/api/categories/reset");
  });

  test("GET /api/categories returns default categories with auto-seed", async ({
    request,
  }) => {
    const response = await request.get("/api/categories");
    expect(response.ok()).toBe(true);

    const categories = await response.json();
    expect(categories).toHaveLength(8);
    expect(categories[0].slug).toBe("bug_correctness");
    expect(categories[0].label).toBeDefined();
    expect(categories[0].color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test("POST /api/categories creates a new category", async ({ request }) => {
    const response = await request.post("/api/categories", {
      data: {
        slug: "e2e_test_cat",
        label: "E2E Test Category",
        description: "Created during E2E testing",
        color: "#abcdef",
      },
    });
    expect(response.status()).toBe(201);

    const created = await response.json();
    expect(created.slug).toBe("e2e_test_cat");
    expect(created.label).toBe("E2E Test Category");

    // Verify it shows up in the list
    const listResponse = await request.get("/api/categories");
    const categories = await listResponse.json();
    expect(categories.some((c: { slug: string }) => c.slug === "e2e_test_cat")).toBe(true);
  });

  test("POST /api/categories returns 400 for missing fields", async ({
    request,
  }) => {
    const response = await request.post("/api/categories", {
      data: { slug: "incomplete" },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/categories returns 409 for duplicate slug", async ({
    request,
  }) => {
    const response = await request.post("/api/categories", {
      data: {
        slug: "bug_correctness",
        label: "Duplicate",
        description: "Already exists",
        color: "#000000",
      },
    });
    expect(response.status()).toBe(409);
  });

  test("PUT /api/categories/[id] updates a category", async ({ request }) => {
    // Get first category
    const listResponse = await request.get("/api/categories");
    const categories = await listResponse.json();
    const firstId = categories[0].id;

    const response = await request.put(`/api/categories/${firstId}`, {
      data: { label: "Updated Label" },
    });
    expect(response.ok()).toBe(true);

    const updated = await response.json();
    expect(updated.label).toBe("Updated Label");
  });

  test("PUT /api/categories/[id] returns 404 for non-existent id", async ({
    request,
  }) => {
    const response = await request.put("/api/categories/99999", {
      data: { label: "Ghost" },
    });
    expect(response.status()).toBe(404);
  });

  test("DELETE /api/categories/[id] removes a category", async ({
    request,
  }) => {
    // Get first category
    const listResponse = await request.get("/api/categories");
    const categories = await listResponse.json();
    const firstId = categories[0].id;

    const response = await request.delete(`/api/categories/${firstId}`);
    expect(response.ok()).toBe(true);

    const body = await response.json();
    expect(body.deleted).toBe(true);

    // Verify removal
    const afterResponse = await request.get("/api/categories");
    const after = await afterResponse.json();
    expect(after).toHaveLength(7);
  });

  test("PUT /api/categories/reorder changes sort order", async ({
    request,
  }) => {
    const listResponse = await request.get("/api/categories");
    const categories = await listResponse.json();
    const ids = categories.map((c: { id: number }) => c.id);
    const reversedIds = [...ids].reverse();

    const response = await request.put("/api/categories/reorder", {
      data: { orderedIds: reversedIds },
    });
    expect(response.ok()).toBe(true);

    // Verify new order
    const afterResponse = await request.get("/api/categories");
    const after = await afterResponse.json();
    expect(after[0].id).toBe(ids[ids.length - 1]);
  });

  test("POST /api/categories/reset restores default categories", async ({
    request,
  }) => {
    // Add a custom category
    await request.post("/api/categories", {
      data: {
        slug: "to_be_reset",
        label: "Temporary",
        description: "Will be removed",
        color: "#ffffff",
      },
    });

    // Reset
    const response = await request.post("/api/categories/reset");
    expect(response.ok()).toBe(true);

    const categories = await response.json();
    expect(categories).toHaveLength(8);
    expect(categories.some((c: { slug: string }) => c.slug === "to_be_reset")).toBe(false);
  });
});

test.describe("Categories Settings Page", () => {
  test.beforeEach(async ({ request }) => {
    await request.post("/api/categories/reset");
  });

  test("displays the categories management page with defaults", async ({
    page,
  }) => {
    await page.goto("/settings/categories");

    await expect(
      page.getByRole("heading", { name: "Review Categories" }),
    ).toBeVisible();

    // Should show 8 default categories (use exact match to avoid strict mode violations)
    await expect(page.getByText("Bug / Correctness", { exact: true })).toBeVisible();
    await expect(page.getByText("Security", { exact: true })).toBeVisible();
    await expect(page.getByText("Performance", { exact: true })).toBeVisible();
  });

  test("can navigate to categories page from sidebar", async ({ page }) => {
    await page.goto("/");

    const sidebar = page.locator("[data-sidebar='sidebar']");
    await sidebar.getByRole("link", { name: "Review Categories" }).click();

    await expect(page).toHaveURL("/settings/categories");
    await expect(
      page.getByRole("heading", { name: "Review Categories" }),
    ).toBeVisible();
  });

  test("can add a new category", async ({ page, request }) => {
    await page.goto("/settings/categories");

    // Open the add form first
    await page.getByRole("button", { name: /add category/i }).click();

    // Fill the add form (use getByRole to avoid placeholder case-insensitive collisions)
    await page.getByRole("textbox", { name: "Label" }).fill("Custom Test");
    await page.getByRole("textbox", { name: "LLM Description" }).fill("Custom test description");

    // Submit
    await page.getByRole("button", { name: /^add$/i }).click();

    // Verify it appears in the list
    await expect(page.getByText("Custom Test", { exact: true })).toBeVisible();

    // Cleanup
    await request.post("/api/categories/reset");
  });
});
