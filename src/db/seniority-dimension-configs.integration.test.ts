// Integration tests for seniority-dimension-configs DAL
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import {
  getAllDimensionConfigs,
  getEnabledDimensionConfigs,
  getDimensionConfigById,
  createDimensionConfig,
  updateDimensionConfig,
  deleteDimensionConfig,
  reorderDimensionConfigs,
  resetDimensionConfigsToDefaults,
} from "./seniority-dimension-configs";

describe("seniority-dimension-configs DAL (integration)", () => {
  let testSqlite: InstanceType<typeof Database>;
  let testDb: ReturnType<typeof drizzle>;

  beforeEach(() => {
    testSqlite = new Database(":memory:");
    testSqlite.pragma("journal_mode = WAL");
    testDb = drizzle(testSqlite, { schema });

    testSqlite.exec(`
      CREATE TABLE seniority_dimension_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        family TEXT NOT NULL,
        label TEXT NOT NULL,
        description TEXT NOT NULL,
        source_categories TEXT,
        is_enabled INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX seniority_dimension_configs_name_unique ON seniority_dimension_configs(name);
      CREATE INDEX idx_seniority_dimension_configs_family ON seniority_dimension_configs(family);
      CREATE INDEX idx_seniority_dimension_configs_enabled ON seniority_dimension_configs(is_enabled);
    `);
  });

  afterEach(() => {
    testSqlite.close();
  });

  // --- Auto-seed ---

  describe("getAllDimensionConfigs (auto-seed)", () => {
    it("seeds 8 default dimensions when table is empty", () => {
      const dims = getAllDimensionConfigs(testDb);
      expect(dims).toHaveLength(8);
    });

    it("returns defaults with correct names", () => {
      const dims = getAllDimensionConfigs(testDb);
      const names = dims.map((d) => d.name);
      expect(names).toEqual([
        "security", "architecture", "performance", "testing",
        "pedagogy", "cross_team_awareness", "boldness", "thoroughness",
      ]);
    });

    it("has 4 technical and 4 soft_skill dimensions", () => {
      const dims = getAllDimensionConfigs(testDb);
      const technical = dims.filter((d) => d.family === "technical");
      const softSkill = dims.filter((d) => d.family === "soft_skill");
      expect(technical).toHaveLength(4);
      expect(softSkill).toHaveLength(4);
    });

    it("assigns sequential sortOrder starting at 0", () => {
      const dims = getAllDimensionConfigs(testDb);
      dims.forEach((dim, index) => {
        expect(dim.sortOrder).toBe(index);
      });
    });

    it("all defaults are enabled", () => {
      const dims = getAllDimensionConfigs(testDb);
      for (const dim of dims) {
        expect(dim.isEnabled).toBe(1);
      }
    });

    it("technical dimensions have sourceCategories", () => {
      const dims = getAllDimensionConfigs(testDb);
      const technical = dims.filter((d) => d.family === "technical");
      for (const dim of technical) {
        expect(dim.sourceCategories).toBeTruthy();
        const parsed = JSON.parse(dim.sourceCategories!);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed.length).toBeGreaterThan(0);
      }
    });

    it("soft_skill dimensions have null sourceCategories", () => {
      const dims = getAllDimensionConfigs(testDb);
      const softSkill = dims.filter((d) => d.family === "soft_skill");
      for (const dim of softSkill) {
        expect(dim.sourceCategories).toBeNull();
      }
    });

    it("does not re-seed if dimensions already exist", () => {
      const first = getAllDimensionConfigs(testDb);
      const second = getAllDimensionConfigs(testDb);
      expect(first.map((d) => d.id)).toEqual(second.map((d) => d.id));
    });
  });

  // --- Enabled filtering ---

  describe("getEnabledDimensionConfigs", () => {
    it("returns all dimensions when all are enabled", () => {
      const all = getAllDimensionConfigs(testDb);
      const enabled = getEnabledDimensionConfigs(testDb);
      expect(enabled).toHaveLength(all.length);
    });

    it("excludes disabled dimensions", () => {
      const all = getAllDimensionConfigs(testDb);
      updateDimensionConfig(all[0].id, { isEnabled: 0 }, testDb);

      const enabled = getEnabledDimensionConfigs(testDb);
      expect(enabled).toHaveLength(all.length - 1);
      expect(enabled.find((d) => d.id === all[0].id)).toBeUndefined();
    });
  });

  // --- getDimensionConfigById ---

  describe("getDimensionConfigById", () => {
    it("returns a dimension by id", () => {
      const dims = getAllDimensionConfigs(testDb);
      const found = getDimensionConfigById(dims[0].id, testDb);
      expect(found).toBeDefined();
      expect(found!.name).toBe(dims[0].name);
    });

    it("returns undefined for non-existent id", () => {
      const found = getDimensionConfigById(9999, testDb);
      expect(found).toBeUndefined();
    });
  });

  // --- Create ---

  describe("createDimensionConfig", () => {
    it("creates a new technical dimension", () => {
      getAllDimensionConfigs(testDb); // seed
      const created = createDimensionConfig(
        {
          name: "observability",
          family: "technical",
          label: "Observability",
          description: "Monitoring and observability practices",
          sourceCategories: ["performance"],
        },
        testDb,
      );
      expect(created.name).toBe("observability");
      expect(created.family).toBe("technical");
      expect(created.isEnabled).toBe(1);
      expect(JSON.parse(created.sourceCategories!)).toEqual(["performance"]);
    });

    it("creates a new soft_skill dimension with null sourceCategories", () => {
      getAllDimensionConfigs(testDb);
      const created = createDimensionConfig(
        {
          name: "empathy",
          family: "soft_skill",
          label: "Empathy",
          description: "Understanding others' perspectives",
        },
        testDb,
      );
      expect(created.sourceCategories).toBeNull();
    });

    it("assigns sortOrder at the end", () => {
      const seeded = getAllDimensionConfigs(testDb);
      const maxOrder = Math.max(...seeded.map((d) => d.sortOrder));

      const created = createDimensionConfig(
        {
          name: "new_dim",
          family: "soft_skill",
          label: "New",
          description: "New dimension",
        },
        testDb,
      );
      expect(created.sortOrder).toBe(maxOrder + 1);
    });

    it("rejects duplicate name", () => {
      getAllDimensionConfigs(testDb);
      expect(() =>
        createDimensionConfig(
          {
            name: "security",
            family: "technical",
            label: "Duplicate",
            description: "Should fail",
            sourceCategories: ["security"],
          },
          testDb,
        ),
      ).toThrow();
    });
  });

  // --- Update ---

  describe("updateDimensionConfig", () => {
    it("updates label", () => {
      const dims = getAllDimensionConfigs(testDb);
      const updated = updateDimensionConfig(dims[0].id, { label: "Updated Label" }, testDb);
      expect(updated).toBeDefined();
      expect(updated!.label).toBe("Updated Label");
    });

    it("updates description", () => {
      const dims = getAllDimensionConfigs(testDb);
      const updated = updateDimensionConfig(dims[0].id, { description: "New desc" }, testDb);
      expect(updated!.description).toBe("New desc");
    });

    it("toggles isEnabled", () => {
      const dims = getAllDimensionConfigs(testDb);
      const updated = updateDimensionConfig(dims[0].id, { isEnabled: 0 }, testDb);
      expect(updated!.isEnabled).toBe(0);

      const reEnabled = updateDimensionConfig(dims[0].id, { isEnabled: 1 }, testDb);
      expect(reEnabled!.isEnabled).toBe(1);
    });

    it("updates sourceCategories", () => {
      const dims = getAllDimensionConfigs(testDb);
      const techDim = dims.find((d) => d.family === "technical")!;
      const updated = updateDimensionConfig(techDim.id, { sourceCategories: ["security", "bug_correctness"] }, testDb);
      expect(JSON.parse(updated!.sourceCategories!)).toEqual(["security", "bug_correctness"]);
    });

    it("updates updatedAt timestamp", () => {
      const dims = getAllDimensionConfigs(testDb);
      const updated = updateDimensionConfig(dims[0].id, { label: "Changed" }, testDb);
      expect(updated!.updatedAt).toBeDefined();
    });

    it("returns undefined for non-existent id", () => {
      const result = updateDimensionConfig(9999, { label: "Ghost" }, testDb);
      expect(result).toBeUndefined();
    });
  });

  // --- Delete ---

  describe("deleteDimensionConfig", () => {
    it("removes a dimension by id", () => {
      const dims = getAllDimensionConfigs(testDb);
      deleteDimensionConfig(dims[0].id, testDb);
      const found = getDimensionConfigById(dims[0].id, testDb);
      expect(found).toBeUndefined();
    });

    it("does not affect other dimensions", () => {
      const dims = getAllDimensionConfigs(testDb);
      deleteDimensionConfig(dims[0].id, testDb);
      const remaining = getAllDimensionConfigs(testDb);
      expect(remaining).toHaveLength(7);
    });

    it("does nothing for non-existent id", () => {
      getAllDimensionConfigs(testDb);
      deleteDimensionConfig(9999, testDb);
      const all = getAllDimensionConfigs(testDb);
      expect(all).toHaveLength(8);
    });
  });

  // --- Reorder ---

  describe("reorderDimensionConfigs", () => {
    it("reorders dimensions by given id order", () => {
      const dims = getAllDimensionConfigs(testDb);
      const reversedIds = [...dims].reverse().map((d) => d.id);

      reorderDimensionConfigs(reversedIds, testDb);

      const reordered = getAllDimensionConfigs(testDb);
      expect(reordered[0].id).toBe(dims[dims.length - 1].id);
      expect(reordered[0].sortOrder).toBe(0);
    });

    it("assigns sequential sortOrder 0..n-1", () => {
      const dims = getAllDimensionConfigs(testDb);
      const ids = dims.map((d) => d.id);
      reorderDimensionConfigs([...ids].reverse(), testDb);

      const reordered = getAllDimensionConfigs(testDb);
      reordered.forEach((dim, index) => {
        expect(dim.sortOrder).toBe(index);
      });
    });
  });

  // --- Reset to defaults ---

  describe("resetDimensionConfigsToDefaults", () => {
    it("deletes all dimensions and re-seeds defaults", () => {
      getAllDimensionConfigs(testDb);
      createDimensionConfig(
        { name: "custom", family: "soft_skill", label: "Custom", description: "To be deleted" },
        testDb,
      );
      expect(getAllDimensionConfigs(testDb)).toHaveLength(9);

      const reset = resetDimensionConfigsToDefaults(testDb);
      expect(reset).toHaveLength(8);
      expect(reset.map((d) => d.name)).not.toContain("custom");
    });

    it("returns fresh defaults with new ids", () => {
      const original = getAllDimensionConfigs(testDb);
      const originalIds = original.map((d) => d.id);

      const reset = resetDimensionConfigsToDefaults(testDb);
      const resetIds = reset.map((d) => d.id);

      expect(resetIds[0]).toBeGreaterThan(originalIds[originalIds.length - 1]);
    });
  });
});
