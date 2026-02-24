// US-2.16: Reclassify comment E2E tests
import { test, expect } from "@playwright/test";

test.describe("Reclassify Comment", () => {
  test("review quality page loads with reclassification-ready UI", async ({
    page,
  }) => {
    await page.goto("/review-quality");

    // Page structure is intact
    await expect(
      page.getByRole("heading", { name: "Review Quality" }),
    ).toBeVisible();
    await expect(page.getByText("Category Distribution")).toBeVisible();
    await expect(
      page.getByText("Classified Comments", { exact: true }),
    ).toBeVisible();
  });

  test("reclassify API rejects invalid category", async ({ request }) => {
    const response = await request.put(
      "/api/review-quality/comments/review_comment/1/classify",
      { data: { category: "invalid_category" } },
    );

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Invalid category");
  });

  test("reclassify API rejects invalid comment type", async ({ request }) => {
    const response = await request.put(
      "/api/review-quality/comments/bad_type/1/classify",
      { data: { category: "security" } },
    );

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Invalid comment type");
  });

  test("reclassify API returns 404 for non-existent classification", async ({
    request,
  }) => {
    const response = await request.put(
      "/api/review-quality/comments/review_comment/99999/classify",
      { data: { category: "security" } },
    );

    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.error).toContain("not found");
  });
});
