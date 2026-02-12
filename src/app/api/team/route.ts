// US-007: Team members API routes (GET all, POST to add)
import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { getSetting } from "@/db/settings";
import {
  getAllTeamMembers,
  getTeamMemberByUsername,
  createTeamMember,
} from "@/db/team-members";

export const dynamic = "force-dynamic";

export async function GET() {
  const members = getAllTeamMembers();
  return NextResponse.json({ members });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { username } = body;

  if (!username || typeof username !== "string" || username.trim().length === 0) {
    return NextResponse.json(
      { error: "GitHub username is required" },
      { status: 400 },
    );
  }

  const trimmedUsername = username.trim();

  const token = getSetting("github_pat");
  if (!token) {
    return NextResponse.json(
      { error: "GitHub PAT not configured. Please configure it in Settings." },
      { status: 400 },
    );
  }

  const existing = getTeamMemberByUsername(trimmedUsername);
  if (existing) {
    return NextResponse.json(
      { error: `User "${trimmedUsername}" already exists in your team.` },
      { status: 409 },
    );
  }

  try {
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.rest.users.getByUsername({
      username: trimmedUsername,
    });

    const member = createTeamMember({
      githubUsername: user.login,
      displayName: user.name ?? user.login,
      avatarUrl: user.avatar_url,
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error
        ? (error as { status: number }).status
        : undefined;

    if (status === 404) {
      return NextResponse.json(
        { error: `GitHub user "${trimmedUsername}" not found.` },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to validate GitHub user",
      },
      { status: 500 },
    );
  }
}
