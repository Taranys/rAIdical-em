// US-024: Search GitHub users by query
import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { getSetting } from "@/db/settings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: "Search query is required" },
      { status: 400 },
    );
  }

  if (query.trim().length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters" },
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
    const response = await octokit.rest.search.users({
      q: query.trim(),
      per_page: 20,
    });

    const users = response.data.items.map((user) => ({
      login: user.login,
      name: user.name ?? null,
      avatarUrl: user.avatar_url,
    }));

    const rateLimit = {
      remaining: parseInt(response.headers["x-ratelimit-remaining"] ?? "0", 10),
      reset: parseInt(response.headers["x-ratelimit-reset"] ?? "0", 10),
    };

    return NextResponse.json({ users, rateLimit });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search GitHub users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
