// Team member color palette and assignment logic

export const TEAM_MEMBER_PALETTE = [
  "#E25A3B", // warm red-orange
  "#2A9D8F", // teal
  "#264653", // dark blue-grey
  "#E9C46A", // gold
  "#F4A261", // sandy orange
  "#7209B7", // purple
  "#3A86FF", // bright blue
  "#06D6A0", // mint green
  "#EF476F", // pink-red
  "#118AB2", // ocean blue
  "#8338EC", // violet
  "#FF6B6B", // coral
] as const;

/**
 * Return the next color to assign to a new team member.
 * Picks the least-used color from the palette (lowest index on tie).
 */
export function getNextColor(existingColors: string[]): string {
  const counts = new Map<string, number>();
  for (const color of TEAM_MEMBER_PALETTE) {
    counts.set(color, 0);
  }
  for (const color of existingColors) {
    const current = counts.get(color);
    if (current !== undefined) {
      counts.set(color, current + 1);
    }
  }

  let best: string = TEAM_MEMBER_PALETTE[0];
  let bestCount = counts.get(best)!;
  for (const color of TEAM_MEMBER_PALETTE) {
    const c = counts.get(color)!;
    if (c < bestCount) {
      best = color;
      bestCount = c;
    }
  }
  return best;
}

/**
 * Build a mapping from GitHub username to hex color for chart usage.
 */
export function buildTeamColorMap(
  members: { githubUsername: string; color: string }[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const m of members) {
    map[m.githubUsername] = m.color;
  }
  return map;
}
