// US-010: GitHub API rate limit endpoint
import { NextResponse } from "next/server";
import { getSetting } from "@/db/settings";
import { fetchRateLimit } from "@/lib/github-sync";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = getSetting("github_pat");
  if (!token) {
    return NextResponse.json(
      { error: "No GitHub PAT configured" },
      { status: 400 },
    );
  }

  try {
    const rateLimit = await fetchRateLimit(token);
    return NextResponse.json({ rateLimit });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch rate limit",
      },
      { status: 500 },
    );
  }
}
