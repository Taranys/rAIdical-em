// US-2.16: API route for manually reclassifying a comment
import { NextResponse } from "next/server";
import { COMMENT_CATEGORIES } from "@/lib/llm/classifier";
import { updateClassification } from "@/db/comment-classifications";

export const dynamic = "force-dynamic";

const VALID_COMMENT_TYPES = ["review_comment", "pr_comment"] as const;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ commentType: string; commentId: string }> },
) {
  const { commentType, commentId: commentIdStr } = await params;

  if (
    !VALID_COMMENT_TYPES.includes(
      commentType as (typeof VALID_COMMENT_TYPES)[number],
    )
  ) {
    return NextResponse.json(
      { error: `Invalid comment type: ${commentType}` },
      { status: 400 },
    );
  }

  const commentId = Number(commentIdStr);
  if (!Number.isInteger(commentId) || commentId <= 0) {
    return NextResponse.json(
      { error: `Invalid comment ID: ${commentIdStr}` },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { category } = body as { category?: string };
  if (
    !category ||
    !COMMENT_CATEGORIES.includes(category as (typeof COMMENT_CATEGORIES)[number])
  ) {
    return NextResponse.json(
      { error: `Invalid category: ${category}` },
      { status: 400 },
    );
  }

  const result = updateClassification(
    commentType as "review_comment" | "pr_comment",
    commentId,
    category,
  );

  if (!result) {
    return NextResponse.json(
      { error: "Classification not found for this comment" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, classification: result });
}
