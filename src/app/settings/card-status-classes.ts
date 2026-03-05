/**
 * Returns Tailwind classes for card background/border based on configuration status.
 * - `true` = configured (green)
 * - `false` = needs data (orange)
 * - `undefined` = loading (no status classes)
 */
export function getCardStatusClasses(isConfigured: boolean | undefined): string {
  if (isConfigured === undefined) return "";
  if (isConfigured) {
    return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
  }
  return "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800";
}
