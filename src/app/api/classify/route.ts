// US-2.05: Batch classification API — trigger classification
import { NextResponse } from "next/server";
import { getSetting } from "@/db/settings";
import { getActiveClassificationRun } from "@/db/classification-runs";
import { classifyComments } from "@/lib/classification-service";

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

  // Check no active run
  const active = getActiveClassificationRun();
  if (active) {
    return NextResponse.json(
      { error: "A classification is already running" },
      { status: 409 },
    );
  }

  // Start classification in background (fire-and-forget, like sync pattern)
  classifyComments();

  return NextResponse.json({ success: true });
}
