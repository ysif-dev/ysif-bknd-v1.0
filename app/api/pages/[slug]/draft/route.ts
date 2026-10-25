import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";

const ALLOWED_SLUGS = ["about", "impact", "privacy-policy", "terms-of-use", "accessibility"];

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    if (!ALLOWED_SLUGS.includes(params.slug)) {
      return NextResponse.json(
        { error: "Only the five designated pages are supported by the visual page editor." },
        { status: 400 }
      );
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await request.json();
    const { blocks, title, subtitle, heroImage, metaTitle, metaDescription, version } = body;

    if (!Array.isArray(blocks) || blocks.length === 0) {
      return NextResponse.json({ error: "Draft must contain at least one content block." }, { status: 400 });
    }

    // 1. Concurrency Check
    const existing = await prisma.pageContent.findUnique({
      where: { slug: params.slug },
    });

    if (existing && typeof version === "number" && version < existing.version) {
      return NextResponse.json(
        {
          error: "Conflict: Newer edits exist on the server. Please review before saving.",
          serverVersion: existing.version,
          clientVersion: version,
        },
        { status: 409 }
      );
    }

    const nextVersion = (existing?.version || 0) + 1;

    // 2. Persist Draft
    const page = await prisma.pageContent.upsert({
      where: { slug: params.slug },
      update: {
        title: title || existing?.title || params.slug,
        subtitle: subtitle !== undefined ? subtitle : existing?.subtitle,
        heroImage: heroImage !== undefined ? heroImage : existing?.heroImage,
        metaTitle: metaTitle !== undefined ? metaTitle : existing?.metaTitle,
        metaDescription: metaDescription !== undefined ? metaDescription : existing?.metaDescription,
        draftContent: blocks,
        draftUpdatedAt: new Date(),
        draftUpdatedBy: session.name || session.email,
        version: nextVersion,
      },
      create: {
        slug: params.slug,
        title: title || params.slug,
        subtitle: subtitle || null,
        content: "Draft content initialized",
        heroImage: heroImage || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        draftContent: blocks,
        draftUpdatedAt: new Date(),
        draftUpdatedBy: session.name || session.email,
        version: 1,
      },
    });

    return NextResponse.json({ success: true, page });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
