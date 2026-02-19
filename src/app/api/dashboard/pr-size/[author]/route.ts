// US-016: API route — individual PRs for a team member (drill-down)
import { NextResponse } from "next/server";
import { getPRsByMember } from "@/db/pull-requests";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ author: string }> },
) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const { author } = await params;

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: 400 },
    );
  }

  const prs = getPRsByMember(author, startDate, endDate);

  return NextResponse.json({ prs });
}
