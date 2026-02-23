// US-2.07: API route for category distribution summary
import { NextResponse } from "next/server";
import { getCategoryDistribution } from "@/db/comment-classifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const distribution = getCategoryDistribution();
  return NextResponse.json(distribution);
}
