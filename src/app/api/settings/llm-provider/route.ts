// US-2.01: LLM provider settings API (GET/PUT/DELETE)
import { NextResponse } from "next/server";
import {
  getSetting,
  setSetting,
  deleteSetting,
  hasSetting,
} from "@/db/settings";
import { isValidProvider, isValidModel } from "@/lib/llm-providers";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = hasSetting("llm_api_key");

  if (!configured) {
    return NextResponse.json({ configured: false });
  }

  const provider = getSetting("llm_provider");
  const model = getSetting("llm_model");

  return NextResponse.json({ configured: true, provider, model });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { provider, model, apiKey } = body;

  if (!isValidProvider(provider)) {
    return NextResponse.json(
      { error: "Invalid or missing provider" },
      { status: 400 },
    );
  }

  if (!model || typeof model !== "string" || !isValidModel(provider, model)) {
    return NextResponse.json(
      { error: "Invalid or missing model for the selected provider" },
      { status: 400 },
    );
  }

  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
    return NextResponse.json(
      { error: "API key is required" },
      { status: 400 },
    );
  }

  setSetting("llm_provider", provider);
  setSetting("llm_model", model);
  setSetting("llm_api_key", apiKey.trim());

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  deleteSetting("llm_provider");
  deleteSetting("llm_model");
  deleteSetting("llm_api_key");

  return NextResponse.json({ success: true });
}
