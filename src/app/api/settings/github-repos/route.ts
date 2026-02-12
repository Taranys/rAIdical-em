// US-006: Search GitHub repositories for a given owner
import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { getSetting } from "@/db/settings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const query = searchParams.get("q") ?? "";

  if (!owner || owner.trim().length === 0) {
    return NextResponse.json(
      { error: "Owner parameter is required" },
      { status: 400 },
    );
  }

  const token = getSetting("github_pat");
  if (!token) {
    return NextResponse.json(
      { error: "No PAT configured" },
      { status: 400 },
    );
  }

  try {
    const octokit = new Octokit({ auth: token });

    const q = query.trim()
      ? `${query.trim()} in:name user:${owner.trim()}`
      : `user:${owner.trim()}`;

    const { data } = await octokit.rest.search.repos({
      q,
      per_page: 20,
      sort: "updated",
    });

    const repos = data.items.map((r) => ({
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      isPrivate: r.private,
    }));

    return NextResponse.json({ repos });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to search repositories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
