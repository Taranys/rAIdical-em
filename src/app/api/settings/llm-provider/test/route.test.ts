// US-2.01: Unit tests for LLM provider test connection API
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/db/settings", () => ({
  hasSetting: vi.fn(),
  getSetting: vi.fn(),
}));

import { hasSetting, getSetting } from "@/db/settings";

const mockHasSetting = vi.mocked(hasSetting);
const mockGetSetting = vi.mocked(getSetting);

describe("POST /api/settings/llm-provider/test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success when LLM provider is configured", async () => {
    mockHasSetting.mockReturnValue(true);
    mockGetSetting.mockImplementation((key: string) => {
      if (key === "llm_provider") return "openai";
      if (key === "llm_model") return "gpt-4o";
      return null;
    });

    const res = await POST();
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.provider).toBe("openai");
    expect(data.model).toBe("gpt-4o");
  });

  it("returns error when no LLM provider is configured", async () => {
    mockHasSetting.mockReturnValue(false);

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();
  });
});
