// API route for updating and deleting a single custom category
import { NextResponse } from "next/server";
import { getCategoryById, updateCategory, deleteCategory, getClassificationCountByCategory } from "@/db/custom-categories";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const existing = getCategoryById(id);
  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const body = await request.json();
  const { slug, label, description, color } = body;

  const updated = updateCategory(id, { slug, label, description, color });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const existing = getCategoryById(id);
  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const classificationCount = getClassificationCountByCategory(existing.slug);
  deleteCategory(id);

  return NextResponse.json({ deleted: true, classificationsAffected: classificationCount });
}
