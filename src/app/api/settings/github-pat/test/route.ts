// US-005: Test GitHub PAT connection
import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { getSetting } from "@/db/settings";

export const dynamic = "force-dynamic";

export async function POST() {
  const token = getSetting("github_pat");
  if (!token) {
    return NextResponse.json(
      { success: false, error: "No PAT configured" },
      { status: 400 },
    );
  }

  try {
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.rest.users.getAuthenticated();

    return NextResponse.json({
      success: true,
      user: { login: user.login, name: user.name },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      },
      { status: 401 },
    );
  }
}
