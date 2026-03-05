// Unit tests for seniority-dimensions API routes
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/db/seniority-dimension-configs", () => ({
  getAllDimensionConfigs: vi.fn(),
  createDimensionConfig: vi.fn(),
  getEnabledDimensionConfigs: vi.fn().mockReturnValue([]),
}));

vi.mock("@/db", () => ({
  db: {},
  sqlite: {},
}));

import { getAllDimensionConfigs, createDimensionConfig } from "@/db/seniority-dimension-configs";

const mockGetAll = vi.mocked(getAllDimensionConfigs);
const mockCreate = vi.mocked(createDimensionConfig);

describe("GET /api/settings/seniority-dimensions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all dimension configs", async () => {
    const configs = [
      { id: 1, name: "security", family: "technical", label: "Security", description: "desc", sourceCategories: '["security"]', isEnabled: 1, sortOrder: 0, createdAt: "", updatedAt: "" },
    ];
    mockGetAll.mockReturnValue(configs as never);

    const response = await GET();
    const data = await response.json();

    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("security");
  });
});

describe("POST /api/settings/seniority-dimensions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a technical dimension with valid input", async () => {
    const created = { id: 9, name: "observability", family: "technical", label: "Observability", description: "desc", sourceCategories: '["performance"]', isEnabled: 1, sortOrder: 8, createdAt: "", updatedAt: "" };
    mockCreate.mockReturnValue(created as never);

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "observability", family: "technical", label: "Observability", description: "desc", sourceCategories: ["performance"] }),
    });

    const response = await POST(req);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.name).toBe("observability");
  });

  it("rejects missing required fields", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "test" }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("rejects invalid family", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "test", family: "unknown", label: "Test", description: "desc" }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("family");
  });

  it("rejects technical dimension without sourceCategories", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "test", family: "technical", label: "Test", description: "desc" }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("creates soft_skill dimension without sourceCategories", async () => {
    const created = { id: 10, name: "empathy", family: "soft_skill", label: "Empathy", description: "desc", sourceCategories: null, isEnabled: 1, sortOrder: 9, createdAt: "", updatedAt: "" };
    mockCreate.mockReturnValue(created as never);

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "empathy", family: "soft_skill", label: "Empathy", description: "desc" }),
    });

    const response = await POST(req);
    expect(response.status).toBe(201);
  });

  it("returns 409 for duplicate name", async () => {
    mockCreate.mockImplementation(() => {
      throw new Error("UNIQUE constraint failed");
    });

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "security", family: "technical", label: "Security", description: "desc", sourceCategories: ["security"] }),
    });

    const response = await POST(req);
    expect(response.status).toBe(409);
  });
});
