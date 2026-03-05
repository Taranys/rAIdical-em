// Seniority dimension configs DAL — CRUD operations + auto-seed logic
import { db as defaultDb } from "./index";
import { seniorityDimensionConfigs } from "./schema";
import { eq, asc, sql } from "drizzle-orm";

type DbInstance = typeof defaultDb;

// --- Types ---

export interface DimensionConfig {
  id: number;
  name: string;
  family: "technical" | "soft_skill";
  label: string;
  description: string;
  sourceCategories: string | null; // JSON array string or null
  isEnabled: number; // 1 or 0
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDimensionConfigInput {
  name: string;
  family: "technical" | "soft_skill";
  label: string;
  description: string;
  sourceCategories?: string[]; // parsed array, stored as JSON
}

export interface UpdateDimensionConfigInput {
  label?: string;
  description?: string;
  sourceCategories?: string[] | null;
  isEnabled?: number;
}

// --- Default dimensions (seeded on first access) ---

const DEFAULT_DIMENSIONS: Omit<DimensionConfig, "id" | "sortOrder" | "createdAt" | "updatedAt">[] = [
  { name: "security", family: "technical", label: "Security", description: "Ability to detect security vulnerabilities, injection risks, and unsafe practices in code reviews", sourceCategories: '["security"]', isEnabled: 1 },
  { name: "architecture", family: "technical", label: "Architecture", description: "Understanding of design patterns, system structure, API contracts, and architectural trade-offs", sourceCategories: '["architecture_design"]', isEnabled: 1 },
  { name: "performance", family: "technical", label: "Performance", description: "Ability to spot performance bottlenecks, inefficient algorithms, and optimization opportunities", sourceCategories: '["performance"]', isEnabled: 1 },
  { name: "testing", family: "technical", label: "Testing", description: "Focus on test coverage, edge cases, test quality, and testing best practices", sourceCategories: '["missing_test_coverage"]', isEnabled: 1 },
  { name: "pedagogy", family: "soft_skill", label: "Pedagogy", description: "Quality of explanations in review comments — does the reviewer teach and explain the 'why', not just point out issues?", sourceCategories: null, isEnabled: 1 },
  { name: "cross_team_awareness", family: "soft_skill", label: "Cross-team Awareness", description: "Understanding of global impacts and challenges beyond the reviewer's own team — awareness of cross-cutting concerns and other teams' constraints", sourceCategories: null, isEnabled: 1 },
  { name: "boldness", family: "soft_skill", label: "Boldness", description: "Willingness to challenge code and push back on decisions, even from senior or experienced authors — constructive courage in reviews", sourceCategories: null, isEnabled: 1 },
  { name: "thoroughness", family: "soft_skill", label: "Thoroughness", description: "Depth and consistency of reviews — does the reviewer systematically check edge cases, error handling, and completeness?", sourceCategories: null, isEnabled: 1 },
];

// --- Auto-seed ---

function seedDefaultDimensions(dbInstance: DbInstance): DimensionConfig[] {
  const now = new Date().toISOString();
  const inserted: DimensionConfig[] = [];
  for (let i = 0; i < DEFAULT_DIMENSIONS.length; i++) {
    const dim = DEFAULT_DIMENSIONS[i];
    const result = dbInstance
      .insert(seniorityDimensionConfigs)
      .values({
        name: dim.name,
        family: dim.family,
        label: dim.label,
        description: dim.description,
        sourceCategories: dim.sourceCategories,
        isEnabled: dim.isEnabled,
        sortOrder: i,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
    inserted.push(result as DimensionConfig);
  }
  return inserted;
}

// --- Queries ---

export function getAllDimensionConfigs(
  dbInstance: DbInstance = defaultDb,
): DimensionConfig[] {
  const existing = dbInstance
    .select()
    .from(seniorityDimensionConfigs)
    .orderBy(asc(seniorityDimensionConfigs.sortOrder))
    .all();

  if (existing.length > 0) return existing as DimensionConfig[];

  // Auto-seed on first access
  return seedDefaultDimensions(dbInstance);
}

export function getEnabledDimensionConfigs(
  dbInstance: DbInstance = defaultDb,
): DimensionConfig[] {
  const all = getAllDimensionConfigs(dbInstance);
  return all.filter((d) => d.isEnabled === 1);
}

export function getDimensionConfigById(
  id: number,
  dbInstance: DbInstance = defaultDb,
): DimensionConfig | undefined {
  return dbInstance
    .select()
    .from(seniorityDimensionConfigs)
    .where(eq(seniorityDimensionConfigs.id, id))
    .get() as DimensionConfig | undefined;
}

// --- Mutations ---

export function createDimensionConfig(
  input: CreateDimensionConfigInput,
  dbInstance: DbInstance = defaultDb,
): DimensionConfig {
  // Ensure auto-seed has run
  getAllDimensionConfigs(dbInstance);

  const maxOrder = dbInstance
    .select({ max: sql<number>`COALESCE(MAX(${seniorityDimensionConfigs.sortOrder}), -1)` })
    .from(seniorityDimensionConfigs)
    .get();

  const now = new Date().toISOString();
  return dbInstance
    .insert(seniorityDimensionConfigs)
    .values({
      name: input.name,
      family: input.family,
      label: input.label,
      description: input.description,
      sourceCategories: input.sourceCategories ? JSON.stringify(input.sourceCategories) : null,
      isEnabled: 1,
      sortOrder: (maxOrder?.max ?? -1) + 1,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get() as DimensionConfig;
}

export function updateDimensionConfig(
  id: number,
  input: UpdateDimensionConfigInput,
  dbInstance: DbInstance = defaultDb,
): DimensionConfig | undefined {
  const now = new Date().toISOString();
  const setValues: Record<string, unknown> = { updatedAt: now };

  if (input.label !== undefined) setValues.label = input.label;
  if (input.description !== undefined) setValues.description = input.description;
  if (input.isEnabled !== undefined) setValues.isEnabled = input.isEnabled;
  if (input.sourceCategories !== undefined) {
    setValues.sourceCategories = input.sourceCategories ? JSON.stringify(input.sourceCategories) : null;
  }

  return dbInstance
    .update(seniorityDimensionConfigs)
    .set(setValues)
    .where(eq(seniorityDimensionConfigs.id, id))
    .returning()
    .get() as DimensionConfig | undefined;
}

export function deleteDimensionConfig(
  id: number,
  dbInstance: DbInstance = defaultDb,
): void {
  dbInstance
    .delete(seniorityDimensionConfigs)
    .where(eq(seniorityDimensionConfigs.id, id))
    .run();
}

export function reorderDimensionConfigs(
  orderedIds: number[],
  dbInstance: DbInstance = defaultDb,
): void {
  const now = new Date().toISOString();
  for (let i = 0; i < orderedIds.length; i++) {
    dbInstance
      .update(seniorityDimensionConfigs)
      .set({ sortOrder: i, updatedAt: now })
      .where(eq(seniorityDimensionConfigs.id, orderedIds[i]))
      .run();
  }
}

export function resetDimensionConfigsToDefaults(
  dbInstance: DbInstance = defaultDb,
): DimensionConfig[] {
  dbInstance.delete(seniorityDimensionConfigs).run();
  return seedDefaultDimensions(dbInstance);
}
