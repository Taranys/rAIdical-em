// API route for listing and creating custom categories
import { NextResponse } from "next/server";
import { getAllCategories, createCategory, getCategoryBySlug } from "@/db/custom-categories";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = getAllCategories();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { slug, label, description, color } = body;

  if (!slug || !label || !description || !color) {
    return NextResponse.json(
      { error: "Missing required fields: slug, label, description, color" },
      { status: 400 },
    );
  }

  // Check for duplicate slug
  const existing = getCategoryBySlug(slug);
  if (existing) {
    return NextResponse.json(
      { error: `Category with slug "${slug}" already exists` },
      { status: 409 },
    );
  }

  const category = createCategory({ slug, label, description, color });
  return NextResponse.json(category, { status: 201 });
}
