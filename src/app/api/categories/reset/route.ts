// API route for resetting categories to defaults
import { NextResponse } from "next/server";
import { resetToDefaults } from "@/db/custom-categories";

export const dynamic = "force-dynamic";

export async function POST() {
  const categories = resetToDefaults();
  return NextResponse.json(categories);
}
