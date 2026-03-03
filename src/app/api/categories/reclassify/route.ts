// API route for triggering reclassification of all comments
import { NextResponse } from "next/server";
import { reclassifyAllComments } from "@/lib/classification-service";

export const dynamic = "force-dynamic";

export async function POST() {
  // Fire-and-forget: start reclassification and return immediately
  const resultPromise = reclassifyAllComments();

  // Return the run info immediately so the UI can poll for progress
  const result = await resultPromise;
  return NextResponse.json(result);
}
