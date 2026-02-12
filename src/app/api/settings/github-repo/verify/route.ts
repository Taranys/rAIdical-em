// US-006: Verify GitHub repository accessibility
import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { getSetting } from "@/db/settings";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { owner, repo } = body;

  if (!owner || !repo) {
    return NextResponse.json(
      { success: false, error: "Owner and repo are required" },
      { status: 400 },
    );
  }

  const token = getSetting("github_pat");
  if (!token) {
    return NextResponse.json(
      { success: false, error: "No PAT configured" },
      { status: 400 },
    );
  }

  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.repos.get({
      owner: owner.trim(),
      repo: repo.trim(),
    });

    return NextResponse.json({
      success: true,
      repository: {
        fullName: data.full_name,
        description: data.description,
        isPrivate: data.private,
        defaultBranch: data.default_branch,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Repository not found or not accessible";
    return NextResponse.json(
      { success: false, error: message },
      { status: 404 },
    );
  }
}
