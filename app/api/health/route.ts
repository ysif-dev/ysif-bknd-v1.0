import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/dal";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbHealth = await checkDatabaseHealth();

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    organization: "YOUTH SPARK INDIA FOUNDATION",
    tagline: "Igniting Potential, Empowering Futures.",
    database: {
      provider: dbHealth.provider,
      isConfigured: dbHealth.isConfigured,
      isConnected: dbHealth.isConnected,
      latencyMs: dbHealth.latencyMs,
      error: dbHealth.error,
    },
    version: "1.0.0",
  });
}
