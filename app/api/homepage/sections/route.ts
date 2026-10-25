import { NextResponse } from "next/server";
import { getHomepageSections } from "@/lib/dal";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sections = await getHomepageSections();
    return NextResponse.json({ success: true, sections });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch homepage sections" },
      { status: 500 }
    );
  }
}
