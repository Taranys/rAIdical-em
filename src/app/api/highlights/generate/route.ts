// US-2.12: Trigger highlight generation
import { NextResponse } from "next/server";
import { getSetting } from "@/db/settings";
import { generateBestCommentHighlights } from "@/lib/highlight-service";

export const dynamic = "force-dynamic";

export async function POST() {
  // Check LLM is configured
  const provider = getSetting("llm_provider");
  const model = getSetting("llm_model");
  const apiKey = getSetting("llm_api_key");

  if (!provider || !model || !apiKey) {
    return NextResponse.json(
      { error: "LLM provider not configured" },
      { status: 400 },
    );
  }

  // Fire and forget (same pattern as /api/classify)
  generateBestCommentHighlights();

  return NextResponse.json({ success: true });
}
