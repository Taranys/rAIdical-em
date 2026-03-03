// Multi-repo support: Single repository management API (DELETE)
import { NextResponse } from "next/server";
import { findRepositoryById, deleteRepositoryWithCascade } from "@/db/repositories";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid repository ID" }, { status: 400 });
  }

  const repo = findRepositoryById(id);
  if (!repo) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  deleteRepositoryWithCascade(id);
  return NextResponse.json({ success: true });
}
