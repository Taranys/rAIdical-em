// Multi-repo support: Repository management API (GET/POST)
import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { getSetting } from "@/db/settings";
import { createRepository, listRepositories, findRepositoryByOwnerName } from "@/db/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  const repos = listRepositories();
  return NextResponse.json(repos);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { owner, name } = body;

  if (!owner || typeof owner !== "string" || owner.trim().length === 0) {
    return NextResponse.json({ error: "Owner is required" }, { status: 400 });
  }
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Repository name is required" }, { status: 400 });
  }

  const trimmedOwner = owner.trim();
  const trimmedName = name.trim();

  // Check for duplicates
  const existing = findRepositoryByOwnerName(trimmedOwner, trimmedName);
  if (existing) {
    return NextResponse.json(
      { error: `Repository ${trimmedOwner}/${trimmedName} is already configured` },
      { status: 409 },
    );
  }

  // Verify GitHub access
  const token = getSetting("github_pat");
  if (!token) {
    return NextResponse.json(
      { error: "No GitHub PAT configured. Please add a PAT in settings first." },
      { status: 400 },
    );
  }

  try {
    const octokit = new Octokit({ auth: token });
    await octokit.rest.repos.get({ owner: trimmedOwner, repo: trimmedName });
  } catch {
    return NextResponse.json(
      { error: `Cannot access repository ${trimmedOwner}/${trimmedName}. Check that the PAT has access.` },
      { status: 403 },
    );
  }

  const repo = createRepository({ owner: trimmedOwner, name: trimmedName });
  return NextResponse.json(repo, { status: 201 });
}
