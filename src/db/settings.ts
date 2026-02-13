// US-005: Settings data access layer
import { db as defaultDb } from "./index";
import { settings } from "./schema";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "@/lib/crypto";

type DbInstance = typeof defaultDb;

const ENCRYPTED_KEYS = new Set(["github_pat", "llm_api_key"]);

export function getSetting(
  key: string,
  dbInstance: DbInstance = defaultDb,
): string | null {
  const row = dbInstance
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .get();

  if (!row) return null;

  return ENCRYPTED_KEYS.has(key) ? decrypt(row.value) : row.value;
}

export function setSetting(
  key: string,
  value: string,
  dbInstance: DbInstance = defaultDb,
): void {
  const storedValue = ENCRYPTED_KEYS.has(key) ? encrypt(value) : value;
  const now = new Date().toISOString();

  dbInstance
    .insert(settings)
    .values({ key, value: storedValue, updatedAt: now })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: storedValue, updatedAt: now },
    })
    .run();
}

export function deleteSetting(
  key: string,
  dbInstance: DbInstance = defaultDb,
): void {
  dbInstance.delete(settings).where(eq(settings.key, key)).run();
}

export function hasSetting(
  key: string,
  dbInstance: DbInstance = defaultDb,
): boolean {
  const row = dbInstance
    .select({ key: settings.key })
    .from(settings)
    .where(eq(settings.key, key))
    .get();

  return row !== undefined;
}
