// US-2.15: API route for classification run history
import { NextResponse } from "next/server";
import { getClassificationRunHistory } from "@/db/classification-runs";

export const dynamic = "force-dynamic";

export async function GET() {
  const runs = getClassificationRunHistory(100);
  return NextResponse.json({ runs });
}
