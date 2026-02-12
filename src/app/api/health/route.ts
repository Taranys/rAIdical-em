import { NextResponse } from "next/server";
import { checkDbHealth } from "@/db/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbHealth = checkDbHealth();

  return NextResponse.json({
    status: dbHealth.connected ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealth,
    },
  });
}
