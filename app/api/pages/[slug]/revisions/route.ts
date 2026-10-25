import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";

const ALLOWED_SLUGS = ["about", "impact", "privacy-policy", "terms-of-use", "accessibility"];

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    if (!ALLOWED_SLUGS.includes(params.slug)) {
      return NextResponse.json(
        { error: "Only the five designated pages are supported." },
        { status: 400 }
      );
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true, revisions: [] });
    }

    const revisions = await prisma.pageRevision.findMany({
      where: { pageSlug: params.slug },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, revisions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
