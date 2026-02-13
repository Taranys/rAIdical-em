// US-2.01: Unit tests for LLM provider settings API
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "./route";

vi.mock("@/db/settings", () => ({
  getSetting: vi.fn(),
  setSetting: vi.fn(),
  deleteSetting: vi.fn(),
  hasSetting: vi.fn(),
}));

import { getSetting, setSetting, deleteSetting, hasSetting } from "@/db/settings";

const mockGetSetting = vi.mocked(getSetting);
const mockSetSetting = vi.mocked(setSetting);
const mockDeleteSetting = vi.mocked(deleteSetting);
const mockHasSetting = vi.mocked(hasSetting);

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/settings/llm-provider", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/settings/llm-provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns configured: false when no provider is stored", async () => {
    mockHasSetting.mockReturnValue(false);

    const res = await GET();
    const data = await res.json();

    expect(data.configured).toBe(false);
    expect(data.provider).toBeUndefined();
    expect(data.model).toBeUndefined();
  });

  it("returns configured: true with provider and model when stored", async () => {
    mockHasSetting.mockReturnValue(true);
    mockGetSetting.mockImplementation((key: string) => {
      if (key === "llm_provider") return "anthropic";
      if (key === "llm_model") return "claude-sonnet-4-5-20250929";
      return null;
    });

    const res = await GET();
    const data = await res.json();

    expect(data.configured).toBe(true);
    expect(data.provider).toBe("anthropic");
    expect(data.model).toBe("claude-sonnet-4-5-20250929");
  });

  it("never returns the API key", async () => {
    mockHasSetting.mockReturnValue(true);
    mockGetSetting.mockImplementation((key: string) => {
      if (key === "llm_provider") return "openai";
      if (key === "llm_model") return "gpt-4o";
      if (key === "llm_api_key") return "sk-secret";
      return null;
    });

    const res = await GET();
    const data = await res.json();

    expect(data.apiKey).toBeUndefined();
    expect(JSON.stringify(data)).not.toContain("sk-secret");
  });
});

describe("PUT /api/settings/llm-provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves provider, model, and apiKey", async () => {
    const res = await PUT(
      makeRequest({
        provider: "openai",
        model: "gpt-4o",
        apiKey: "sk-test123",
      }),
    );
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(mockSetSetting).toHaveBeenCalledWith("llm_provider", "openai");
    expect(mockSetSetting).toHaveBeenCalledWith("llm_model", "gpt-4o");
    expect(mockSetSetting).toHaveBeenCalledWith("llm_api_key", "sk-test123");
  });

  it("returns 400 when provider is invalid", async () => {
    const res = await PUT(
      makeRequest({
        provider: "invalid-provider",
        model: "gpt-4o",
        apiKey: "sk-test",
      }),
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("returns 400 when model is invalid for provider", async () => {
    const res = await PUT(
      makeRequest({
        provider: "openai",
        model: "claude-sonnet-4-5-20250929",
        apiKey: "sk-test",
      }),
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("returns 400 when apiKey is empty", async () => {
    const res = await PUT(
      makeRequest({
        provider: "openai",
        model: "gpt-4o",
        apiKey: "",
      }),
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 when apiKey is missing", async () => {
    const res = await PUT(
      makeRequest({
        provider: "openai",
        model: "gpt-4o",
      }),
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 when provider is missing", async () => {
    const res = await PUT(
      makeRequest({
        model: "gpt-4o",
        apiKey: "sk-test",
      }),
    );

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/settings/llm-provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes all three LLM settings keys", async () => {
    const res = await DELETE();
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(mockDeleteSetting).toHaveBeenCalledWith("llm_provider");
    expect(mockDeleteSetting).toHaveBeenCalledWith("llm_model");
    expect(mockDeleteSetting).toHaveBeenCalledWith("llm_api_key");
  });
});
