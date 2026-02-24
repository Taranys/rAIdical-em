// US-2.07: API route for classified comments with filtering and sorting
import { NextResponse } from "next/server";
import { getClassifiedComments } from "@/db/comment-classifications";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const filters = {
    category: searchParams.get("category") || undefined,
    reviewer: searchParams.get("reviewer") || undefined,
    dateStart: searchParams.get("dateStart") || undefined,
    dateEnd: searchParams.get("dateEnd") || undefined,
    minConfidence: searchParams.get("minConfidence")
      ? Number(searchParams.get("minConfidence"))
      : undefined,
  };

  const sort = {
    sortBy:
      (searchParams.get("sortBy") as "date" | "confidence" | "category") ||
      "date",
    sortOrder:
      (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
  };

  const comments = getClassifiedComments(filters, sort);
  return NextResponse.json({ comments });
}
