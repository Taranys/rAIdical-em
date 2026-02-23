// US-2.06: Auto-classify on sync setting API (GET/PUT)
import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/db/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const stored = getSetting("auto_classify_on_sync");
  // Default to enabled when setting doesn't exist
  const enabled = stored !== "false";
  return NextResponse.json({ enabled });
}

export async function PUT(request: Request) {
  const body = await request.json();

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { error: "enabled must be a boolean" },
      { status: 400 },
    );
  }

  setSetting("auto_classify_on_sync", body.enabled ? "true" : "false");
  return NextResponse.json({ success: true });
}
