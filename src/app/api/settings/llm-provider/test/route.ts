// US-2.01: LLM provider test connection API (mock — real SDK calls in US-2.02)
import { NextResponse } from "next/server";
import { hasSetting, getSetting } from "@/db/settings";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!hasSetting("llm_api_key")) {
    return NextResponse.json(
      { success: false, error: "No LLM provider configured" },
      { status: 400 },
    );
  }

  const provider = getSetting("llm_provider");
  const model = getSetting("llm_model");

  // TODO US-2.02: Replace mock with real SDK call via LLM abstraction layer
  return NextResponse.json({
    success: true,
    provider,
    model,
    message: "Connection successful (mock)",
  });
}
