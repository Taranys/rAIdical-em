// Tests for team member color palette and assignment logic
import { describe, it, expect } from "vitest";
import {
  TEAM_MEMBER_PALETTE,
  getNextColor,
  buildTeamColorMap,
} from "./team-colors";

describe("TEAM_MEMBER_PALETTE", () => {
  it("has exactly 12 colors", () => {
    expect(TEAM_MEMBER_PALETTE).toHaveLength(12);
  });

  it("contains only valid hex colors", () => {
    for (const color of TEAM_MEMBER_PALETTE) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("contains only unique colors", () => {
    const unique = new Set(TEAM_MEMBER_PALETTE);
    expect(unique.size).toBe(TEAM_MEMBER_PALETTE.length);
  });
});

describe("getNextColor", () => {
  it("returns the first palette color when no colors are in use", () => {
    expect(getNextColor([])).toBe(TEAM_MEMBER_PALETTE[0]);
  });

  it("returns the next unused color sequentially", () => {
    expect(getNextColor([TEAM_MEMBER_PALETTE[0]])).toBe(
      TEAM_MEMBER_PALETTE[1],
    );
    expect(
      getNextColor([TEAM_MEMBER_PALETTE[0], TEAM_MEMBER_PALETTE[1]]),
    ).toBe(TEAM_MEMBER_PALETTE[2]);
  });

  it("returns the first color when all 12 are used (cycle)", () => {
    const allUsed = [...TEAM_MEMBER_PALETTE];
    expect(getNextColor(allUsed)).toBe(TEAM_MEMBER_PALETTE[0]);
  });

  it("picks the least-used color", () => {
    // Color 0 used twice, color 1 used once, rest unused
    const existing = [
      TEAM_MEMBER_PALETTE[0],
      TEAM_MEMBER_PALETTE[0],
      TEAM_MEMBER_PALETTE[1],
    ];
    // Should pick color 2 (first unused = count 0)
    expect(getNextColor(existing)).toBe(TEAM_MEMBER_PALETTE[2]);
  });

  it("picks lowest-index on tie", () => {
    // All 12 used once — tie at count 1, should pick index 0
    const allOnce = [...TEAM_MEMBER_PALETTE];
    expect(getNextColor(allOnce)).toBe(TEAM_MEMBER_PALETTE[0]);
  });

  it("ignores colors not in the palette", () => {
    const existing = ["#000000", "#FFFFFF"];
    expect(getNextColor(existing)).toBe(TEAM_MEMBER_PALETTE[0]);
  });
});

describe("buildTeamColorMap", () => {
  it("returns a mapping from username to color", () => {
    const members = [
      { githubUsername: "alice", color: "#E25A3B" },
      { githubUsername: "bob", color: "#2A9D8F" },
    ];
    expect(buildTeamColorMap(members)).toEqual({
      alice: "#E25A3B",
      bob: "#2A9D8F",
    });
  });

  it("returns empty object for empty array", () => {
    expect(buildTeamColorMap([])).toEqual({});
  });
});
