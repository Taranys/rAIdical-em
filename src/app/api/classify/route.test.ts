// US-2.05: Classify API route unit tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/settings", () => ({
  getSetting: vi.fn(),
}));

vi.mock("@/db/classification-runs", () => ({
  getActiveClassificationRun: vi.fn(),
}));

vi.mock("@/lib/classification-service", () => ({
  classifyComments: vi.fn(),
}));

import { POST } from "./route";
import { getSetting } from "@/db/settings";
import { getActiveClassificationRun } from "@/db/classification-runs";
import { classifyComments } from "@/lib/classification-service";

function setupValidSettings() {
  vi.mocked(getSetting).mockImplementation((key: string) => {
    if (key === "llm_provider") return "anthropic";
    if (key === "llm_model") return "claude-haiku-4-5-20251001";
    if (key === "llm_api_key") return "sk-test-key";
    return null;
  });
}

describe("POST /api/classify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when LLM is not configured", async () => {
    vi.mocked(getSetting).mockReturnValue(null);

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/LLM/i);
  });

  it("returns 409 when classification is already running", async () => {
    setupValidSettings();
    vi.mocked(getActiveClassificationRun).mockReturnValue({
      id: 1,
      startedAt: "2026-02-23T10:00:00Z",
      completedAt: null,
      status: "running",
      commentsProcessed: 5,
      errors: 0,
      modelUsed: "claude-haiku-4-5-20251001",
    });

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toMatch(/already/i);
  });

  it("starts classification and returns success", async () => {
    setupValidSettings();
    vi.mocked(getActiveClassificationRun).mockReturnValue(null);
    vi.mocked(classifyComments).mockResolvedValue({
      runId: 1,
      status: "success",
      commentsProcessed: 10,
      totalComments: 10,
      errors: 0,
      summary: {
        categories: [],
        totalClassified: 10,
        averageConfidence: 75,
      },
    });

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(classifyComments).toHaveBeenCalled();
  });
});
