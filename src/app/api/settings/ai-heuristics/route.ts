// US-020: AI heuristics configuration API (GET/PUT/DELETE)
import { NextResponse } from "next/server";
import { getSetting, setSetting, deleteSetting } from "@/db/settings";
import {
  DEFAULT_AI_HEURISTICS,
  type AiHeuristicsConfig,
} from "@/lib/ai-detection";

export const dynamic = "force-dynamic";

export async function GET() {
  const stored = getSetting("ai_heuristics");

  if (!stored) {
    return NextResponse.json({
      configured: false,
      config: DEFAULT_AI_HEURISTICS,
    });
  }

  const config = JSON.parse(stored) as AiHeuristicsConfig;
  return NextResponse.json({ configured: true, config });
}

function isValidConfig(config: unknown): config is AiHeuristicsConfig {
  if (!config || typeof config !== "object") return false;

  const c = config as Record<string, unknown>;

  if (!Array.isArray(c.coAuthorPatterns)) return false;
  if (!Array.isArray(c.authorBotList)) return false;
  if (!Array.isArray(c.branchNamePatterns)) return false;
  if (!Array.isArray(c.labels)) return false;

  if (!c.enabled || typeof c.enabled !== "object") return false;

  const e = c.enabled as Record<string, unknown>;
  if (typeof e.coAuthor !== "boolean") return false;
  if (typeof e.authorBot !== "boolean") return false;
  if (typeof e.branchName !== "boolean") return false;
  if (typeof e.label !== "boolean") return false;

  return true;
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { config } = body;

  if (!isValidConfig(config)) {
    return NextResponse.json(
      { error: "Invalid configuration structure" },
      { status: 400 },
    );
  }

  setSetting("ai_heuristics", JSON.stringify(config));
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  deleteSetting("ai_heuristics");
  return NextResponse.json({ success: true });
}
