// API route for updating and deleting a single seniority dimension config
import { NextResponse } from "next/server";
import {
  getDimensionConfigById,
  updateDimensionConfig,
  deleteDimensionConfig,
} from "@/db/seniority-dimension-configs";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const existing = getDimensionConfigById(id);
  if (!existing) {
    return NextResponse.json({ error: "Dimension not found" }, { status: 404 });
  }

  const body = await request.json();
  const { label, description, sourceCategories, isEnabled } = body;

  const updated = updateDimensionConfig(id, {
    ...(label !== undefined && { label }),
    ...(description !== undefined && { description }),
    ...(sourceCategories !== undefined && { sourceCategories }),
    ...(isEnabled !== undefined && { isEnabled }),
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  deleteDimensionConfig(id);
  return new NextResponse(null, { status: 204 });
}
