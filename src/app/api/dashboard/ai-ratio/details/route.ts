// API route — AI ratio PR details per author
import { NextResponse } from "next/server";
import { getPRDetailsByAuthor } from "@/db/pull-requests";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const author = searchParams.get("author");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!author || !startDate || !endDate) {
    return NextResponse.json(
      { error: "author, startDate, and endDate are required" },
      { status: 400 },
    );
  }

  const repositoryId = searchParams.get("repositoryId")
    ? parseInt(searchParams.get("repositoryId")!, 10)
    : undefined;

  const prs = getPRDetailsByAuthor(author, startDate, endDate, undefined, repositoryId);

  return NextResponse.json({ prs });
}
