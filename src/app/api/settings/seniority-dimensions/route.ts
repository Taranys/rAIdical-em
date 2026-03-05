// API route for listing and creating seniority dimension configs
import { NextResponse } from "next/server";
import {
  getAllDimensionConfigs,
  createDimensionConfig,
} from "@/db/seniority-dimension-configs";

export const dynamic = "force-dynamic";

export async function GET() {
  const configs = getAllDimensionConfigs();
  return NextResponse.json(configs);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, family, label, description, sourceCategories } = body;

  if (!name || !family || !label || !description) {
    return NextResponse.json(
      { error: "Missing required fields: name, family, label, description" },
      { status: 400 },
    );
  }

  if (family !== "technical" && family !== "soft_skill") {
    return NextResponse.json(
      { error: "family must be 'technical' or 'soft_skill'" },
      { status: 400 },
    );
  }

  if (family === "technical" && (!sourceCategories || !Array.isArray(sourceCategories) || sourceCategories.length === 0)) {
    return NextResponse.json(
      { error: "Technical dimensions require at least one sourceCategory" },
      { status: 400 },
    );
  }

  try {
    const config = createDimensionConfig({
      name,
      family,
      label,
      description,
      sourceCategories: family === "technical" ? sourceCategories : undefined,
    });
    return NextResponse.json(config, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE constraint")) {
      return NextResponse.json(
        { error: `Dimension with name "${name}" already exists` },
        { status: 409 },
      );
    }
    throw err;
  }
}
