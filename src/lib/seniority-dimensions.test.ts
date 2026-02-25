// US-2.10: Seniority dimensions configuration tests
import { describe, it, expect } from "vitest";
import {
  SOFT_SKILL_DIMENSIONS,
  TECHNICAL_CATEGORY_DIMENSIONS,
  type SeniorityDimension,
} from "./seniority-dimensions";

describe("TECHNICAL_CATEGORY_DIMENSIONS", () => {
  it("maps classification categories to technical dimensions", () => {
    expect(TECHNICAL_CATEGORY_DIMENSIONS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "security",
          family: "technical",
        }),
        expect.objectContaining({
          name: "architecture",
          family: "technical",
        }),
        expect.objectContaining({
          name: "performance",
          family: "technical",
        }),
        expect.objectContaining({
          name: "testing",
          family: "technical",
        }),
      ]),
    );
  });

  it("all dimensions have a non-empty description", () => {
    for (const dim of TECHNICAL_CATEGORY_DIMENSIONS) {
      expect(dim.description.length).toBeGreaterThan(0);
    }
  });

  it("all dimensions have family set to technical", () => {
    for (const dim of TECHNICAL_CATEGORY_DIMENSIONS) {
      expect(dim.family).toBe("technical");
    }
  });

  it("each dimension has a sourceCategories array with at least one category", () => {
    for (const dim of TECHNICAL_CATEGORY_DIMENSIONS) {
      expect(dim.sourceCategories.length).toBeGreaterThan(0);
    }
  });
});

describe("SOFT_SKILL_DIMENSIONS", () => {
  it("defines the 4 soft skill dimensions", () => {
    const names = SOFT_SKILL_DIMENSIONS.map((d) => d.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "pedagogy",
        "cross_team_awareness",
        "boldness",
        "thoroughness",
      ]),
    );
    expect(names).toHaveLength(4);
  });

  it("all dimensions have family set to soft_skill", () => {
    for (const dim of SOFT_SKILL_DIMENSIONS) {
      expect(dim.family).toBe("soft_skill");
    }
  });

  it("all dimensions have a non-empty description", () => {
    for (const dim of SOFT_SKILL_DIMENSIONS) {
      expect(dim.description.length).toBeGreaterThan(0);
    }
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
