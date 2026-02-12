// US-005: GitHub PAT settings API (GET/PUT/DELETE)
import { NextResponse } from "next/server";
import { setSetting, deleteSetting, hasSetting } from "@/db/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = hasSetting("github_pat");
  return NextResponse.json({ configured });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { token } = body;

  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  setSetting("github_pat", token.trim());
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  deleteSetting("github_pat");
  return NextResponse.json({ success: true });
}
