// US-2.05: Classification progress API
import { NextResponse } from "next/server";
import {
  getLatestClassificationRun,
  getClassificationRunHistory,
} from "@/db/classification-runs";
import { getClassificationSummary } from "@/db/comment-classifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const latestRun = getLatestClassificationRun();
  const history = getClassificationRunHistory(10);

  const summary = latestRun
    ? getClassificationSummary(latestRun.id)
    : null;

  return NextResponse.json({ run: latestRun, summary, history });
}
