// US-2.06: Unit tests for auto-classify setting API
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "./route";

vi.mock("@/db/settings", () => ({
  getSetting: vi.fn(),
  setSetting: vi.fn(),
}));

import { getSetting, setSetting } from "@/db/settings";

const mockGetSetting = vi.mocked(getSetting);
const mockSetSetting = vi.mocked(setSetting);

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/settings/auto-classify", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/settings/auto-classify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns enabled: true when setting is not configured (default)", async () => {
    mockGetSetting.mockReturnValue(null);

    const res = await GET();
    const data = await res.json();

    expect(data.enabled).toBe(true);
  });

  it("returns enabled: true when setting is 'true'", async () => {
    mockGetSetting.mockReturnValue("true");

    const res = await GET();
    const data = await res.json();

    expect(data.enabled).toBe(true);
  });

  it("returns enabled: false when setting is 'false'", async () => {
    mockGetSetting.mockReturnValue("false");

    const res = await GET();
    const data = await res.json();

    expect(data.enabled).toBe(false);
  });
});

describe("PUT /api/settings/auto-classify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves enabled: true", async () => {
    const res = await PUT(makeRequest({ enabled: true }));
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(mockSetSetting).toHaveBeenCalledWith("auto_classify_on_sync", "true");
  });

  it("saves enabled: false", async () => {
    const res = await PUT(makeRequest({ enabled: false }));
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(mockSetSetting).toHaveBeenCalledWith("auto_classify_on_sync", "false");
  });

  it("returns 400 when enabled is not a boolean", async () => {
    const res = await PUT(makeRequest({ enabled: "yes" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when body is missing enabled field", async () => {
    const res = await PUT(makeRequest({}));
    expect(res.status).toBe(400);
  });
});
