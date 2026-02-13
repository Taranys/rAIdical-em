// US-024: List teams of a GitHub organization
import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { getSetting } from "@/db/settings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const org = searchParams.get("org");

  if (!org || org.trim().length === 0) {
    return NextResponse.json(
      { error: "Organization name is required" },
      { status: 400 },
    );
  }

  const token = getSetting("github_pat");
  if (!token) {
    return NextResponse.json(
      { error: "GitHub PAT not configured. Please configure it in Settings." },
      { status: 400 },
    );
  }

  try {
    const octokit = new Octokit({ auth: token });
    const response = await octokit.rest.teams.list({
      org: org.trim(),
      per_page: 100,
    });

    const teams = response.data.map((team) => ({
      slug: team.slug,
      name: team.name,
      description: team.description,
    }));

    const rateLimit = {
      remaining: parseInt(response.headers["x-ratelimit-remaining"] ?? "0", 10),
      reset: parseInt(response.headers["x-ratelimit-reset"] ?? "0", 10),
    };

    return NextResponse.json({ teams, rateLimit });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error
        ? (error as { status: number }).status
        : undefined;

    if (status === 404) {
      return NextResponse.json(
        { error: `Organization "${org.trim()}" not found.` },
        { status: 404 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to list organization teams";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
