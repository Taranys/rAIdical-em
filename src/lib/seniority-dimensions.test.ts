// Seniority dimensions tests — DB-backed accessor functions
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/seniority-dimension-configs", () => ({
  getEnabledDimensionConfigs: vi.fn(),
}));

// Prevent real DB connection
vi.mock("@/db", () => ({
  db: {},
  sqlite: {},
}));

import {
  getActiveTechnicalDimensions,
  getActiveSoftSkillDimensions,
  getActiveDimensionNames,
  type SeniorityDimension,
} from "./seniority-dimensions";
import { getEnabledDimensionConfigs } from "@/db/seniority-dimension-configs";

const mockConfigs = [
  { id: 1, name: "security", family: "technical", label: "Security", description: "Security desc", sourceCategories: '["security"]', isEnabled: 1, sortOrder: 0, createdAt: "", updatedAt: "" },
  { id: 2, name: "architecture", family: "technical", label: "Architecture", description: "Architecture desc", sourceCategories: '["architecture_design"]', isEnabled: 1, sortOrder: 1, createdAt: "", updatedAt: "" },
  { id: 3, name: "performance", family: "technical", label: "Performance", description: "Performance desc", sourceCategories: '["performance"]', isEnabled: 1, sortOrder: 2, createdAt: "", updatedAt: "" },
  { id: 4, name: "testing", family: "technical", label: "Testing", description: "Testing desc", sourceCategories: '["missing_test_coverage"]', isEnabled: 1, sortOrder: 3, createdAt: "", updatedAt: "" },
  { id: 5, name: "pedagogy", family: "soft_skill", label: "Pedagogy", description: "Pedagogy desc", sourceCategories: null, isEnabled: 1, sortOrder: 4, createdAt: "", updatedAt: "" },
  { id: 6, name: "cross_team_awareness", family: "soft_skill", label: "Cross-team Awareness", description: "Cross-team desc", sourceCategories: null, isEnabled: 1, sortOrder: 5, createdAt: "", updatedAt: "" },
  { id: 7, name: "boldness", family: "soft_skill", label: "Boldness", description: "Boldness desc", sourceCategories: null, isEnabled: 1, sortOrder: 6, createdAt: "", updatedAt: "" },
  { id: 8, name: "thoroughness", family: "soft_skill", label: "Thoroughness", description: "Thoroughness desc", sourceCategories: null, isEnabled: 1, sortOrder: 7, createdAt: "", updatedAt: "" },
];

describe("getActiveTechnicalDimensions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEnabledDimensionConfigs).mockReturnValue(mockConfigs as never);
  });

  it("returns 4 technical dimensions from DB", () => {
    const dims = getActiveTechnicalDimensions();
    expect(dims).toHaveLength(4);
    expect(dims.map((d) => d.name)).toEqual(["security", "architecture", "performance", "testing"]);
  });

  it("all dimensions have family set to technical", () => {
    for (const dim of getActiveTechnicalDimensions()) {
      expect(dim.family).toBe("technical");
    }
  });

  it("all dimensions have a non-empty description", () => {
    for (const dim of getActiveTechnicalDimensions()) {
      expect(dim.description.length).toBeGreaterThan(0);
    }
  });

  it("each dimension has a sourceCategories array with at least one category", () => {
    for (const dim of getActiveTechnicalDimensions()) {
      expect(dim.sourceCategories.length).toBeGreaterThan(0);
    }
  });
});

describe("getActiveSoftSkillDimensions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEnabledDimensionConfigs).mockReturnValue(mockConfigs as never);
  });

  it("returns 4 soft skill dimensions from DB", () => {
    const dims = getActiveSoftSkillDimensions();
    expect(dims).toHaveLength(4);
    expect(dims.map((d) => d.name)).toEqual(["pedagogy", "cross_team_awareness", "boldness", "thoroughness"]);
  });

  it("all dimensions have family set to soft_skill", () => {
    for (const dim of getActiveSoftSkillDimensions()) {
      expect(dim.family).toBe("soft_skill");
    }
  });

  it("all dimensions have a non-empty description", () => {
    for (const dim of getActiveSoftSkillDimensions()) {
      expect(dim.description.length).toBeGreaterThan(0);
    }
  });
});

describe("getActiveDimensionNames", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEnabledDimensionConfigs).mockReturnValue(mockConfigs as never);
  });

  it("contains exactly the 8 enabled dimension names", () => {
    const names = getActiveDimensionNames();
    expect(names).toEqual(
      new Set([
        "security", "architecture", "performance", "testing",
        "pedagogy", "cross_team_awareness", "boldness", "thoroughness",
      ]),
    );
    expect(names.size).toBe(8);
  });

  it("excludes disabled dimensions", () => {
    const partialConfigs = mockConfigs.filter((c) => c.name !== "testing");
    vi.mocked(getEnabledDimensionConfigs).mockReturnValue(partialConfigs as never);

    const names = getActiveDimensionNames();
    expect(names.has("testing")).toBe(false);
    expect(names.size).toBe(7);
  });
});

describe("SeniorityDimension type", () => {
  it("allows creating a custom dimension with required fields", () => {
    const dim: SeniorityDimension = {
      name: "custom_skill",
      family: "soft_skill",
      description: "A custom skill to track",
    };
    expect(dim.name).toBe("custom_skill");
    expect(dim.family).toBe("soft_skill");
    expect(dim.description).toBe("A custom skill to track");
  });
});
