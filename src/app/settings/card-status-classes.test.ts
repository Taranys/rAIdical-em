import { describe, it, expect } from "vitest";
import { getCardStatusClasses } from "./card-status-classes";

describe("getCardStatusClasses", () => {
  it("returns green classes when configured is true", () => {
    const result = getCardStatusClasses(true);
    expect(result).toContain("bg-green-50");
    expect(result).toContain("dark:bg-green-950/30");
    expect(result).toContain("border-green-200");
    expect(result).toContain("dark:border-green-800");
  });

  it("returns orange classes when configured is false", () => {
    const result = getCardStatusClasses(false);
    expect(result).toContain("bg-orange-50");
    expect(result).toContain("dark:bg-orange-950/30");
    expect(result).toContain("border-orange-200");
    expect(result).toContain("dark:border-orange-800");
  });

  it("returns empty string when configured is undefined (loading)", () => {
    expect(getCardStatusClasses(undefined)).toBe("");
  });
});
