import { NextResponse } from "next/server";
import { resetDatabase } from "@/db";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    resetDatabase();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error during database reset.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
