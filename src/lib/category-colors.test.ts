// US-2.07: Category color mapping tests
import { describe, it, expect } from "vitest";
import { CATEGORY_CONFIG } from "./category-colors";
import { COMMENT_CATEGORIES } from "./llm/classifier";

describe("CATEGORY_CONFIG", () => {
  it("has an entry for every comment category", () => {
    for (const category of COMMENT_CATEGORIES) {
      expect(CATEGORY_CONFIG[category]).toBeDefined();
    }
  });

  it("each entry has bg, text, and label properties", () => {
    for (const category of COMMENT_CATEGORIES) {
      const config = CATEGORY_CONFIG[category];
      expect(config.bg).toBeTruthy();
      expect(config.text).toBeTruthy();
      expect(config.label).toBeTruthy();
    }
  });
});
