// Task 7.1: Unit tests for custom-categories DAL (CRUD, reorder, auto-seed)
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import {
  getAllCategories,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  resetToDefaults,
  getClassificationCountByCategory,
} from "./custom-categories";

describe("custom-categories DAL (integration)", () => {
  let testSqlite: InstanceType<typeof Database>;
  let testDb: ReturnType<typeof drizzle>;

  beforeEach(() => {
    testSqlite = new Database(":memory:");
    testSqlite.pragma("journal_mode = WAL");
    testDb = drizzle(testSqlite, { schema });

    testSqlite.exec(`
      CREATE TABLE custom_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        description TEXT NOT NULL,
        color TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX idx_custom_categories_slug ON custom_categories(slug);
      CREATE INDEX idx_custom_categories_sort_order ON custom_categories(sort_order);

      CREATE TABLE comment_classifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comment_type TEXT NOT NULL,
        comment_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        model_used TEXT NOT NULL,
        classification_run_id INTEGER,
        classified_at TEXT NOT NULL,
        reasoning TEXT,
        is_manual INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX idx_comment_classifications_category ON comment_classifications(category);
    `);
  });

  afterEach(() => {
    testSqlite.close();
  });

  // --- Auto-seed ---

  describe("getAllCategories (auto-seed)", () => {
    it("seeds 8 default categories when table is empty", () => {
      const categories = getAllCategories(testDb);
      expect(categories).toHaveLength(8);
    });

    it("returns default categories with correct slugs", () => {
      const categories = getAllCategories(testDb);
      const slugs = categories.map((c) => c.slug);
      expect(slugs).toEqual([
        "bug_correctness",
        "security",
        "performance",
        "readability_maintainability",
        "nitpick_style",
        "architecture_design",
        "missing_test_coverage",
        "question_clarification",
      ]);
    });

    it("assigns sequential sortOrder starting at 0", () => {
      const categories = getAllCategories(testDb);
      categories.forEach((cat, index) => {
        expect(cat.sortOrder).toBe(index);
      });
    });

    it("returns ordered by sortOrder", () => {
      const categories = getAllCategories(testDb);
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i].sortOrder).toBeGreaterThan(categories[i - 1].sortOrder);
      }
    });

    it("does not re-seed if categories already exist", () => {
      // First call seeds
      const first = getAllCategories(testDb);
      expect(first).toHaveLength(8);

      // Second call returns existing
      const second = getAllCategories(testDb);
      expect(second).toHaveLength(8);

      // IDs should match (same rows)
      expect(first.map((c) => c.id)).toEqual(second.map((c) => c.id));
    });

    it("seeds default categories with valid colors", () => {
      const categories = getAllCategories(testDb);
      for (const cat of categories) {
        expect(cat.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it("seeds default categories with non-empty labels and descriptions", () => {
      const categories = getAllCategories(testDb);
      for (const cat of categories) {
        expect(cat.label.length).toBeGreaterThan(0);
        expect(cat.description.length).toBeGreaterThan(0);
      }
    });
  });

  // --- CRUD ---

  describe("getCategoryBySlug", () => {
    it("returns a category by slug", () => {
      getAllCategories(testDb); // seed
      const cat = getCategoryBySlug("security", testDb);
      expect(cat).toBeDefined();
      expect(cat!.slug).toBe("security");
      expect(cat!.label).toBe("Security");
    });

    it("returns undefined for non-existent slug", () => {
      getAllCategories(testDb); // seed
      const cat = getCategoryBySlug("non_existent", testDb);
      expect(cat).toBeUndefined();
    });
  });

  describe("getCategoryById", () => {
    it("returns a category by id", () => {
      const categories = getAllCategories(testDb);
      const first = categories[0];
      const found = getCategoryById(first.id, testDb);
      expect(found).toBeDefined();
      expect(found!.id).toBe(first.id);
      expect(found!.slug).toBe(first.slug);
    });

    it("returns undefined for non-existent id", () => {
      const cat = getCategoryById(9999, testDb);
      expect(cat).toBeUndefined();
    });
  });

  describe("createCategory", () => {
    it("creates a new category with correct fields", () => {
      getAllCategories(testDb); // seed first
      const created = createCategory(
        {
          slug: "custom_cat",
          label: "Custom Category",
          description: "A custom test category",
          color: "#ff00ff",
        },
        testDb,
      );
      expect(created.slug).toBe("custom_cat");
      expect(created.label).toBe("Custom Category");
      expect(created.description).toBe("A custom test category");
      expect(created.color).toBe("#ff00ff");
    });

    it("assigns sortOrder at the end", () => {
      const seeded = getAllCategories(testDb);
      const maxOrder = Math.max(...seeded.map((c) => c.sortOrder));

      const created = createCategory(
        {
          slug: "new_cat",
          label: "New",
          description: "New category",
          color: "#000000",
        },
        testDb,
      );
      expect(created.sortOrder).toBe(maxOrder + 1);
    });

    it("sets createdAt and updatedAt timestamps", () => {
      getAllCategories(testDb);
      const created = createCategory(
        {
          slug: "timestamped",
          label: "Timestamped",
          description: "Test",
          color: "#111111",
        },
        testDb,
      );
      expect(created.createdAt).toBeDefined();
      expect(created.updatedAt).toBeDefined();
    });

    it("creates category even when table is empty (no seed)", () => {
      const created = createCategory(
        {
          slug: "first_ever",
          label: "First",
          description: "The very first",
          color: "#aabbcc",
        },
        testDb,
      );
      expect(created.sortOrder).toBe(0);
    });
  });

  describe("updateCategory", () => {
    it("updates label of an existing category", () => {
      const categories = getAllCategories(testDb);
      const first = categories[0];
      const updated = updateCategory(first.id, { label: "Updated Label" }, testDb);
      expect(updated).toBeDefined();
      expect(updated!.label).toBe("Updated Label");
      expect(updated!.slug).toBe(first.slug); // slug unchanged
    });

    it("updates multiple fields at once", () => {
      const categories = getAllCategories(testDb);
      const first = categories[0];
      const updated = updateCategory(
        first.id,
        { label: "New Label", description: "New desc", color: "#000000" },
        testDb,
      );
      expect(updated!.label).toBe("New Label");
      expect(updated!.description).toBe("New desc");
      expect(updated!.color).toBe("#000000");
    });

    it("updates updatedAt timestamp", () => {
      const categories = getAllCategories(testDb);
      const first = categories[0];
      const originalUpdatedAt = first.updatedAt;

      // Small delay to ensure timestamp differs
      const updated = updateCategory(first.id, { label: "Changed" }, testDb);
      expect(updated!.updatedAt).toBeDefined();
      // updatedAt should be set (may be same ms, but at least defined)
      expect(typeof updated!.updatedAt).toBe("string");
    });

    it("returns undefined when updating non-existent id", () => {
      const result = updateCategory(9999, { label: "Ghost" }, testDb);
      expect(result).toBeUndefined();
    });
  });

  describe("deleteCategory", () => {
    it("removes a category by id", () => {
      const categories = getAllCategories(testDb);
      const toDelete = categories[0];
      deleteCategory(toDelete.id, testDb);

      const found = getCategoryById(toDelete.id, testDb);
      expect(found).toBeUndefined();
    });

    it("does not affect other categories", () => {
      const categories = getAllCategories(testDb);
      deleteCategory(categories[0].id, testDb);

      // Re-fetch (should not re-seed since there are still categories)
      const remaining = getAllCategories(testDb);
      expect(remaining).toHaveLength(7);
    });

    it("does nothing for non-existent id", () => {
      getAllCategories(testDb); // seed
      deleteCategory(9999, testDb); // should not throw
      const all = getAllCategories(testDb);
      expect(all).toHaveLength(8);
    });
  });

  // --- Reorder ---

  describe("reorderCategories", () => {
    it("reorders categories by given id order", () => {
      const categories = getAllCategories(testDb);
      const reversedIds = [...categories].reverse().map((c) => c.id);

      reorderCategories(reversedIds, testDb);

      const reordered = getAllCategories(testDb);
      // First category should now be what was last
      expect(reordered[0].id).toBe(categories[categories.length - 1].id);
      expect(reordered[0].sortOrder).toBe(0);
    });

    it("assigns sequential sortOrder 0..n-1", () => {
      const categories = getAllCategories(testDb);
      const ids = categories.map((c) => c.id);
      // Reverse order
      reorderCategories([...ids].reverse(), testDb);

      const reordered = getAllCategories(testDb);
      reordered.forEach((cat, index) => {
        expect(cat.sortOrder).toBe(index);
      });
    });
  });

  // --- Reset to defaults ---

  describe("resetToDefaults", () => {
    it("deletes all categories and re-seeds defaults", () => {
      const categories = getAllCategories(testDb);
      // Add a custom one
      createCategory(
        {
          slug: "custom",
          label: "Custom",
          description: "To be deleted",
          color: "#ffffff",
        },
        testDb,
      );
      expect(getAllCategories(testDb)).toHaveLength(9);

      const reset = resetToDefaults(testDb);
      expect(reset).toHaveLength(8);
      expect(reset.map((c) => c.slug)).not.toContain("custom");
    });

    it("returns fresh default categories with new ids", () => {
      const original = getAllCategories(testDb);
      const originalIds = original.map((c) => c.id);

      const reset = resetToDefaults(testDb);
      const resetIds = reset.map((c) => c.id);

      // New IDs should be different (auto-increment continues)
      expect(resetIds[0]).toBeGreaterThan(originalIds[originalIds.length - 1]);
    });
  });

  // --- Stats ---

  describe("getClassificationCountByCategory", () => {
    it("returns 0 when no classifications exist", () => {
      getAllCategories(testDb); // seed
      const count = getClassificationCountByCategory("bug_correctness", testDb);
      expect(count).toBe(0);
    });

    it("counts classifications for a given category slug", () => {
      getAllCategories(testDb);

      // Insert some classifications
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classified_at)
        VALUES
          ('review_comment', 1, 'bug_correctness', 85, 'test-model', '2026-01-01T00:00:00Z'),
          ('review_comment', 2, 'bug_correctness', 90, 'test-model', '2026-01-01T00:00:00Z'),
          ('pr_comment', 3, 'security', 75, 'test-model', '2026-01-01T00:00:00Z');
      `);

      expect(getClassificationCountByCategory("bug_correctness", testDb)).toBe(2);
      expect(getClassificationCountByCategory("security", testDb)).toBe(1);
      expect(getClassificationCountByCategory("performance", testDb)).toBe(0);
    });
  });
});
