// US-2.02: Unit tests for Claude Code API key import endpoint
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/keychain", () => ({
  readKeychainPassword: vi.fn(),
}));

vi.mock("@/db/settings", () => ({
  setSetting: vi.fn(),
}));

import { readKeychainPassword } from "@/lib/keychain";
import { setSetting } from "@/db/settings";
import { POST } from "./route";

const mockReadKeychain = vi.mocked(readKeychainPassword);
const mockSetSetting = vi.mocked(setSetting);

describe("POST /api/settings/llm-provider/import-claude-code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("imports API key from keychain and saves config", async () => {
    mockReadKeychain.mockResolvedValue("sk-ant-api03-test-key");

    const res = await POST();
    const data = await res.json();

    expect(mockReadKeychain).toHaveBeenCalledWith("Claude Code");
    expect(data.success).toBe(true);
    expect(data.provider).toBe("anthropic");
    expect(data.model).toBe("claude-sonnet-4-5-20250929");
    expect(mockSetSetting).toHaveBeenCalledWith("llm_provider", "anthropic");
    expect(mockSetSetting).toHaveBeenCalledWith("llm_model", "claude-sonnet-4-5-20250929");
    expect(mockSetSetting).toHaveBeenCalledWith("llm_api_key", "sk-ant-api03-test-key");
  });

  it("returns error when no key found in keychain", async () => {
    mockReadKeychain.mockResolvedValue(null);

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();
    expect(mockSetSetting).not.toHaveBeenCalled();
  });

  it("returns error when keychain read fails", async () => {
    mockReadKeychain.mockRejectedValue(new Error("keychain error"));

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
