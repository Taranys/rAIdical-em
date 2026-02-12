// US-006: GitHub repository configuration API (GET/PUT/DELETE)
import { NextResponse } from "next/server";
import { getSetting, setSetting, deleteSetting } from "@/db/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const owner = getSetting("github_owner");
  const repo = getSetting("github_repo");
  return NextResponse.json({
    configured: owner !== null && repo !== null,
    owner,
    repo,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { owner, repo } = body;

  if (!owner || typeof owner !== "string" || owner.trim().length === 0) {
    return NextResponse.json({ error: "Owner is required" }, { status: 400 });
  }
  if (!repo || typeof repo !== "string" || repo.trim().length === 0) {
    return NextResponse.json(
      { error: "Repository is required" },
      { status: 400 },
    );
  }

  setSetting("github_owner", owner.trim());
  setSetting("github_repo", repo.trim());
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  deleteSetting("github_owner");
  deleteSetting("github_repo");
  return NextResponse.json({ success: true });
}
