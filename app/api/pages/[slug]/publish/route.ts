import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

const ALLOWED_SLUGS = ["about", "impact", "privacy-policy", "terms-of-use", "accessibility"];

export async function POST(
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
    const { blocks, title, subtitle, heroImage, metaTitle, metaDescription, changeSummary } = body;

    const existing = await prisma.pageContent.findUnique({
      where: { slug: params.slug },
    });

    const publishedBlocks = blocks || existing?.draftContent || existing?.publishedContent;
    if (!Array.isArray(publishedBlocks) || publishedBlocks.length === 0) {
      return NextResponse.json({ error: "Cannot publish an empty page. Please add content blocks." }, { status: 400 });
    }

    const nextVersion = (existing?.version || 0) + 1;
    const now = new Date();

    // Transactional publication & revision snapshot
    const [updatedPage, revision] = await prisma.$transaction([
      prisma.pageContent.upsert({
        where: { slug: params.slug },
        update: {
          title: title || existing?.title || params.slug,
          subtitle: subtitle !== undefined ? subtitle : existing?.subtitle,
          heroImage: heroImage !== undefined ? heroImage : existing?.heroImage,
          metaTitle: metaTitle !== undefined ? metaTitle : existing?.metaTitle,
          metaDescription: metaDescription !== undefined ? metaDescription : existing?.metaDescription,
          publishedContent: publishedBlocks,
          draftContent: publishedBlocks,
          publishedAt: now,
          publishedBy: session.name || session.email,
          version: nextVersion,
        },
        create: {
          slug: params.slug,
          title: title || params.slug,
          subtitle: subtitle || null,
          content: "Published visual page",
          heroImage: heroImage || null,
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          publishedContent: publishedBlocks,
          draftContent: publishedBlocks,
          publishedAt: now,
          publishedBy: session.name || session.email,
          version: 1,
        },
      }),

      prisma.pageRevision.create({
        data: {
          pageSlug: params.slug,
          version: nextVersion,
          title: title || existing?.title || params.slug,
          subtitle: subtitle || existing?.subtitle || null,
          blocks: publishedBlocks,
          heroImage: heroImage || existing?.heroImage || null,
          metaTitle: metaTitle || existing?.metaTitle || null,
          metaDescription: metaDescription || existing?.metaDescription || null,
          createdById: session.id !== "admin-initial" ? session.id : null,
          createdByName: session.name || session.email,
          changeSummary: changeSummary || `Published version ${nextVersion}`,
        },
      }),
    ]);

    // Audit Log
    if (session.id && session.id !== "admin-initial") {
      let validUserId: string | null = null;
      try {
        const u = await prisma.adminUser.findUnique({
          where: { id: session.id },
          select: { id: true },
        });
        if (u) validUserId = u.id;
      } catch {
        // Fall back to null userId if not found
      }

      await prisma.auditLog.create({
        data: {
          userId: validUserId,
          actorEmail: session.email || null,
          actorName: session.name || null,
          actorRole: session.role || null,
          action: "PAGE_PUBLISHED",
          category: "CMS_EDIT",
          entity: "PageContent",
          entityId: params.slug,
          targetLabel: `/${params.slug} (v${nextVersion})`,
          details: `Published visual page /${params.slug} version ${nextVersion} (${publishedBlocks.length} blocks).`,
          outcome: "SUCCESS",
        },
      }).catch(() => {});
    }

    // Revalidate public page paths
    revalidatePath("/");
    revalidatePath(`/${params.slug}`);
    revalidatePath("/about");
    revalidatePath("/impact");
    revalidatePath("/privacy-policy");
    revalidatePath("/terms-of-use");
    revalidatePath("/accessibility");

    return NextResponse.json({ success: true, page: updatedPage, revision });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
