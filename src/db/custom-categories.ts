// Custom categories DAL — CRUD operations + auto-seed logic
import { db as defaultDb } from "./index";
import { customCategories, commentClassifications } from "./schema";
import { eq, sql, count, asc } from "drizzle-orm";

type DbInstance = typeof defaultDb;

// --- Types ---

export interface CustomCategory {
  id: number;
  slug: string;
  label: string;
  description: string;
  color: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  slug: string;
  label: string;
  description: string;
  color: string;
}

export interface UpdateCategoryInput {
  slug?: string;
  label?: string;
  description?: string;
  color?: string;
}

// --- Default categories (seeded on first access) ---

const DEFAULT_CATEGORIES: Omit<CustomCategory, "id" | "sortOrder" | "createdAt" | "updatedAt">[] = [
  { slug: "bug_correctness", label: "Bug / Correctness", description: "Points out bugs, logic errors, incorrect behavior, or missing null checks", color: "#ef4444" },
  { slug: "security", label: "Security", description: "Flags security vulnerabilities, injection risks, or unsafe practices", color: "#f97316" },
  { slug: "performance", label: "Performance", description: "Highlights performance bottlenecks, inefficient algorithms, or unnecessary re-renders", color: "#eab308" },
  { slug: "readability_maintainability", label: "Readability", description: "Suggests clearer naming, better structure, or easier-to-read code", color: "#3b82f6" },
  { slug: "nitpick_style", label: "Nitpick / Style", description: "Minor style/formatting preferences, often subjective (e.g., trailing commas, spacing)", color: "#6b7280" },
  { slug: "architecture_design", label: "Architecture", description: "Addresses design patterns, system structure, API contracts, or architectural concerns", color: "#a855f7" },
  { slug: "missing_test_coverage", label: "Missing Tests", description: "Points out missing tests, untested edge cases, or poor test quality", color: "#22c55e" },
  { slug: "question_clarification", label: "Question", description: "Asks a question or seeks clarification about intent or behavior", color: "#06b6d4" },
];

// --- Auto-seed ---

function seedDefaultCategories(dbInstance: DbInstance): CustomCategory[] {
  const now = new Date().toISOString();
  const inserted: CustomCategory[] = [];
  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    const cat = DEFAULT_CATEGORIES[i];
    const result = dbInstance
      .insert(customCategories)
      .values({
        slug: cat.slug,
        label: cat.label,
        description: cat.description,
        color: cat.color,
        sortOrder: i,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
    inserted.push(result);
  }
  return inserted;
}

// --- Queries ---

export function getAllCategories(
  dbInstance: DbInstance = defaultDb,
): CustomCategory[] {
  const existing = dbInstance
    .select()
    .from(customCategories)
    .orderBy(asc(customCategories.sortOrder))
    .all();

  if (existing.length > 0) return existing;

  // Auto-seed on first access
  return seedDefaultCategories(dbInstance);
}

export function getCategoryBySlug(
  slug: string,
  dbInstance: DbInstance = defaultDb,
): CustomCategory | undefined {
  return dbInstance
    .select()
    .from(customCategories)
    .where(eq(customCategories.slug, slug))
    .get();
}

export function getCategoryById(
  id: number,
  dbInstance: DbInstance = defaultDb,
): CustomCategory | undefined {
  return dbInstance
    .select()
    .from(customCategories)
    .where(eq(customCategories.id, id))
    .get();
}

// --- Mutations ---

export function createCategory(
  input: CreateCategoryInput,
  dbInstance: DbInstance = defaultDb,
): CustomCategory {
  // Auto-assign sortOrder to the end
  const maxOrder = dbInstance
    .select({ max: sql<number>`COALESCE(MAX(${customCategories.sortOrder}), -1)` })
    .from(customCategories)
    .get();

  const now = new Date().toISOString();
  return dbInstance
    .insert(customCategories)
    .values({
      slug: input.slug,
      label: input.label,
      description: input.description,
      color: input.color,
      sortOrder: (maxOrder?.max ?? -1) + 1,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();
}

export function updateCategory(
  id: number,
  input: UpdateCategoryInput,
  dbInstance: DbInstance = defaultDb,
): CustomCategory | undefined {
  const now = new Date().toISOString();
  return dbInstance
    .update(customCategories)
    .set({ ...input, updatedAt: now })
    .where(eq(customCategories.id, id))
    .returning()
    .get();
}

export function deleteCategory(
  id: number,
  dbInstance: DbInstance = defaultDb,
): void {
  dbInstance
    .delete(customCategories)
    .where(eq(customCategories.id, id))
    .run();
}

export function reorderCategories(
  orderedIds: number[],
  dbInstance: DbInstance = defaultDb,
): void {
  const now = new Date().toISOString();
  for (let i = 0; i < orderedIds.length; i++) {
    dbInstance
      .update(customCategories)
      .set({ sortOrder: i, updatedAt: now })
      .where(eq(customCategories.id, orderedIds[i]))
      .run();
  }
}

export function resetToDefaults(
  dbInstance: DbInstance = defaultDb,
): CustomCategory[] {
  dbInstance.delete(customCategories).run();
  return seedDefaultCategories(dbInstance);
}

// --- Stats ---

export function getClassificationCountByCategory(
  categorySlug: string,
  dbInstance: DbInstance = defaultDb,
): number {
  const result = dbInstance
    .select({ count: count() })
    .from(commentClassifications)
    .where(eq(commentClassifications.category, categorySlug))
    .get();
  return result?.count ?? 0;
}
