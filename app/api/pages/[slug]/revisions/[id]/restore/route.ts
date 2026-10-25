import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";

const ALLOWED_SLUGS = ["about", "impact", "privacy-policy", "terms-of-use", "accessibility"];

export async function POST(
  request: Request,
  { params }: { params: { slug: string; id: string } }
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
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const revision = await prisma.pageRevision.findUnique({
      where: { id: params.id },
    });

    if (!revision || revision.pageSlug !== params.slug) {
      return NextResponse.json({ error: "Historical revision snapshot not found" }, { status: 404 });
    }

    const existing = await prisma.pageContent.findUnique({
      where: { slug: params.slug },
    });

    const nextVersion = (existing?.version || 0) + 1;

    // Restore revision into draftContent (creates a new working draft from the snapshot)
    const updatedPage = await prisma.pageContent.update({
      where: { slug: params.slug },
      data: {
        title: revision.title,
        subtitle: revision.subtitle,
        heroImage: revision.heroImage,
        metaTitle: revision.metaTitle,
        metaDescription: revision.metaDescription,
        draftContent: revision.blocks as any,
        draftUpdatedAt: new Date(),
        draftUpdatedBy: session.name || session.email,
        version: nextVersion,
      },
    });

    // Record audit log
    if (session.id && session.id !== "admin-initial") {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: "pages.restore_revision",
          entity: "PageContent",
          entityId: params.slug,
          details: JSON.stringify({
            restoredRevisionId: revision.id,
            restoredVersion: revision.version,
            newDraftVersion: nextVersion,
            operator: session.email,
          }),
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, page: updatedPage });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
