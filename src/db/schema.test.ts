// US-022: Phase 1 database schema unit tests
import { describe, it, expect } from "vitest";
import * as schema from "./schema";

describe("Phase 1 schema exports", () => {
  it("exports all 7 tables", () => {
    expect(schema.settings).toBeDefined();
    expect(schema.teamMembers).toBeDefined();
    expect(schema.pullRequests).toBeDefined();
    expect(schema.reviews).toBeDefined();
    expect(schema.reviewComments).toBeDefined();
    expect(schema.prComments).toBeDefined();
    expect(schema.syncRuns).toBeDefined();
  });

  it("does not export the old healthCheck table", () => {
    expect("healthCheck" in schema).toBe(false);
  });
});
