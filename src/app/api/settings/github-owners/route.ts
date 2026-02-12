// US-006: Prefetch GitHub owners (authenticated user + their organizations)
import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { getSetting } from "@/db/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = getSetting("github_pat");
  if (!token) {
    return NextResponse.json(
      { error: "No PAT configured" },
      { status: 400 },
    );
  }

  try {
    const octokit = new Octokit({ auth: token });

    const [{ data: user }, { data: orgs }] = await Promise.all([
      octokit.rest.users.getAuthenticated(),
      octokit.rest.orgs.listForAuthenticatedUser(),
    ]);

    const owners = [
      { login: user.login, type: "user" as const },
      ...orgs.map((org) => ({ login: org.login, type: "org" as const })),
    ];

    return NextResponse.json({ owners });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch owners";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
