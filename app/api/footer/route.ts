import { NextResponse } from "next/server";
import { getSiteSettings, getSocialProfiles } from "@/lib/dal";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [settings, socialProfiles] = await Promise.all([
      getSiteSettings(),
      getSocialProfiles(),
    ]);

    return NextResponse.json({
      success: true,
      settings,
      socialProfiles,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
