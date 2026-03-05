// API route for resetting seniority dimension configs to defaults
import { NextResponse } from "next/server";
import { resetDimensionConfigsToDefaults } from "@/db/seniority-dimension-configs";

export const dynamic = "force-dynamic";

export async function POST() {
  const configs = resetDimensionConfigsToDefaults();
  return NextResponse.json(configs);
}
