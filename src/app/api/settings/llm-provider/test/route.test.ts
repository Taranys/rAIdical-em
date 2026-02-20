// US-2.02: Unit tests for LLM provider test connection API (real SDK call)
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/settings", () => ({
  hasSetting: vi.fn(),
  getSetting: vi.fn(),
}));

const mockClassify = vi.fn();

vi.mock("@/lib/llm", () => ({
  createLLMServiceFromSettings: vi.fn(() => ({ classify: mockClassify })),
  LLMAuthError: class LLMAuthError extends Error {
    constructor() {
      super("Authentication failed — check your API key");
      this.name = "LLMAuthError";
    }
  },
  LLMRateLimitError: class LLMRateLimitError extends Error {
    constructor() {
      super("Rate limit exceeded — try again later");
      this.name = "LLMRateLimitError";
    }
  },
}));

import { hasSetting, getSetting } from "@/db/settings";
import { POST } from "./route";
import { LLMAuthError, LLMRateLimitError } from "@/lib/llm";

const mockHasSetting = vi.mocked(hasSetting);
const mockGetSetting = vi.mocked(getSetting);

describe("POST /api/settings/llm-provider/test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when no LLM provider is configured", async () => {
    mockHasSetting.mockReturnValue(false);

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();
  });

  it("returns success when LLM call succeeds", async () => {
    mockHasSetting.mockReturnValue(true);
    mockGetSetting.mockImplementation((key: string) => {
      if (key === "llm_provider") return "openai";
      if (key === "llm_model") return "gpt-4o";
      return null;
    });
    mockClassify.mockResolvedValue({ content: "Hello" });

    const res = await POST();
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.provider).toBe("openai");
    expect(data.model).toBe("gpt-4o");
    expect(data.message).toBe("Connection successful");
  });

  it("returns 401 on auth error", async () => {
    mockHasSetting.mockReturnValue(true);
    mockGetSetting.mockImplementation((key: string) => {
      if (key === "llm_provider") return "openai";
      if (key === "llm_model") return "gpt-4o";
      return null;
    });
    mockClassify.mockRejectedValue(new LLMAuthError());

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Authentication");
  });

  it("returns 429 on rate limit error", async () => {
    mockHasSetting.mockReturnValue(true);
    mockGetSetting.mockImplementation((key: string) => {
      if (key === "llm_provider") return "anthropic";
      if (key === "llm_model") return "claude-sonnet-4-5-20250929";
      return null;
    });
    mockClassify.mockRejectedValue(new LLMRateLimitError());

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.success).toBe(false);
  });

  it("returns 500 on unknown error", async () => {
    mockHasSetting.mockReturnValue(true);
    mockGetSetting.mockImplementation((key: string) => {
      if (key === "llm_provider") return "google";
      if (key === "llm_model") return "gemini-2.0-flash";
      return null;
    });
    mockClassify.mockRejectedValue(new Error("Something broke"));

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Something broke");
  });
});
