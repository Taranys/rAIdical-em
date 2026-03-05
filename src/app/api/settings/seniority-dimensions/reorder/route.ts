// API route for reordering seniority dimension configs
import { NextResponse } from "next/server";
import { reorderDimensionConfigs } from "@/db/seniority-dimension-configs";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const body = await request.json();
  const { orderedIds } = body;

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json(
      { error: "orderedIds must be a non-empty array of dimension IDs" },
      { status: 400 },
    );
  }

  reorderDimensionConfigs(orderedIds);
  return NextResponse.json({ success: true });
}
