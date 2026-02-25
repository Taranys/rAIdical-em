// US-2.10: Trigger seniority profile computation
import { NextResponse } from "next/server";
import { getSetting } from "@/db/settings";
import { computeSeniorityProfiles } from "@/lib/seniority-profile-service";

export const dynamic = "force-dynamic";

export async function POST() {
  // Check LLM is configured (needed for soft skill inference)
  const provider = getSetting("llm_provider");
  const model = getSetting("llm_model");
  const apiKey = getSetting("llm_api_key");

  if (!provider || !model || !apiKey) {
    return NextResponse.json(
      { error: "LLM provider not configured" },
      { status: 400 },
    );
  }

  // Fire and forget (same pattern as /api/highlights/generate)
  computeSeniorityProfiles();

  return NextResponse.json({ success: true });
}
