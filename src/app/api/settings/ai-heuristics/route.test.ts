// US-020: Unit tests for AI heuristics configuration API
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "./route";
import { DEFAULT_AI_HEURISTICS } from "@/lib/ai-detection";

vi.mock("@/db/settings", () => ({
  getSetting: vi.fn(),
  setSetting: vi.fn(),
  deleteSetting: vi.fn(),
}));

import { getSetting, setSetting, deleteSetting } from "@/db/settings";

const mockGetSetting = vi.mocked(getSetting);
const mockSetSetting = vi.mocked(setSetting);
const mockDeleteSetting = vi.mocked(deleteSetting);

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/settings/ai-heuristics", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/settings/ai-heuristics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns defaults when no config is stored", async () => {
    mockGetSetting.mockReturnValue(null);

    const res = await GET();
    const data = await res.json();

    expect(data.configured).toBe(false);
    expect(data.config).toEqual(DEFAULT_AI_HEURISTICS);
  });

  it("returns stored config when present", async () => {
    const stored = { ...DEFAULT_AI_HEURISTICS, authorBotList: ["custom-bot"] };
    mockGetSetting.mockReturnValue(JSON.stringify(stored));

    const res = await GET();
    const data = await res.json();

    expect(data.configured).toBe(true);
    expect(data.config.authorBotList).toEqual(["custom-bot"]);
  });
});

describe("PUT /api/settings/ai-heuristics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves a valid config", async () => {
    const res = await PUT(makeRequest({ config: DEFAULT_AI_HEURISTICS }));
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(mockSetSetting).toHaveBeenCalledWith(
      "ai_heuristics",
      JSON.stringify(DEFAULT_AI_HEURISTICS),
    );
  });

  it("returns 400 when config is missing", async () => {
    const res = await PUT(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when config has wrong structure", async () => {
    const res = await PUT(
      makeRequest({ config: { coAuthorPatterns: "not-an-array" } }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when enabled flags are missing", async () => {
    const res = await PUT(
      makeRequest({
        config: {
          coAuthorPatterns: [],
          authorBotList: [],
          branchNamePatterns: [],
          labels: [],
          // missing enabled
        },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when enabled flags are not booleans", async () => {
    const res = await PUT(
      makeRequest({
        config: {
          coAuthorPatterns: [],
          authorBotList: [],
          branchNamePatterns: [],
          labels: [],
          enabled: {
            coAuthor: "yes",
            authorBot: true,
            branchName: true,
            label: true,
          },
        },
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/settings/ai-heuristics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes config and returns success", async () => {
    const res = await DELETE();
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(mockDeleteSetting).toHaveBeenCalledWith("ai_heuristics");
  });
});
