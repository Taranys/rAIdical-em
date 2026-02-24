// US-2.10: Detect programming language from file path extension
import { FILE_EXTENSION_TO_LANGUAGE } from "./seniority-dimensions";

/**
 * Extracts the programming language from a file path based on its extension.
 * Returns null if the file path is null, empty, has no extension, or the extension is unknown.
 */
export function detectLanguage(filePath: string | null): string | null {
  if (!filePath) return null;

  const lastDot = filePath.lastIndexOf(".");
  if (lastDot === -1) return null;

  // Ensure the dot is in the filename, not just a directory
  const lastSlash = filePath.lastIndexOf("/");
  if (lastDot < lastSlash) return null;

  const ext = filePath.slice(lastDot).toLowerCase();
  return FILE_EXTENSION_TO_LANGUAGE[ext] ?? null;
}
