// US-2.02: LLM provider test connection API (real SDK call)
import { NextResponse } from "next/server";
import { hasSetting, getSetting } from "@/db/settings";
import { createLLMServiceFromSettings, LLMAuthError, LLMRateLimitError } from "@/lib/llm";

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

  try {
    const service = createLLMServiceFromSettings();
    await service.classify("Say hello in one word.");

    return NextResponse.json({
      success: true,
      provider,
      model,
      message: "Connection successful",
    });
  } catch (error) {
    if (error instanceof LLMAuthError) {
      return NextResponse.json(
        { success: false, error: error.message, provider, model },
        { status: 401 },
      );
    }
    if (error instanceof LLMRateLimitError) {
      return NextResponse.json(
        { success: false, error: error.message, provider, model },
        { status: 429 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        provider,
        model,
      },
      { status: 500 },
    );
  }
}
