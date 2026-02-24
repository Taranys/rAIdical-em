// US-2.12: Highlights generate API route unit tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/settings", () => ({
  getSetting: vi.fn(),
}));

vi.mock("@/lib/highlight-service", () => ({
  generateBestCommentHighlights: vi.fn(),
}));

import { POST } from "./route";
import { getSetting } from "@/db/settings";
import { generateBestCommentHighlights } from "@/lib/highlight-service";

function setupValidSettings() {
  vi.mocked(getSetting).mockImplementation((key: string) => {
    if (key === "llm_provider") return "anthropic";
    if (key === "llm_model") return "claude-haiku-4-5-20251001";
    if (key === "llm_api_key") return "sk-test-key";
    return null;
  });
}

describe("POST /api/highlights/generate", () => {
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

  it("starts highlight generation and returns success", async () => {
    setupValidSettings();
    vi.mocked(generateBestCommentHighlights).mockResolvedValue({
      status: "success",
      teamMembersProcessed: 3,
      highlightsGenerated: 10,
      errors: 0,
    });

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(generateBestCommentHighlights).toHaveBeenCalled();
  });
});
