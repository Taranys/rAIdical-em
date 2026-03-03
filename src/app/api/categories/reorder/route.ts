// API route for reordering custom categories
import { NextResponse } from "next/server";
import { reorderCategories } from "@/db/custom-categories";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const body = await request.json();
  const { orderedIds } = body;

  if (!Array.isArray(orderedIds) || orderedIds.some((id: unknown) => typeof id !== "number")) {
    return NextResponse.json(
      { error: "orderedIds must be an array of numbers" },
      { status: 400 },
    );
  }

  reorderCategories(orderedIds);
  return NextResponse.json({ success: true });
}
