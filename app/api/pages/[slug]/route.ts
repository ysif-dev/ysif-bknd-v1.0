import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

const ALLOWED_SLUGS = ["about", "impact", "privacy-policy", "terms-of-use", "accessibility"];

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    if (!ALLOWED_SLUGS.includes(params.slug)) {
      return NextResponse.json(
        { error: "Only the five designated pages (about, impact, privacy-policy, terms-of-use, accessibility) are supported." },
        { status: 400 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    let page = await prisma.pageContent.findUnique({
      where: { slug: params.slug },
    });

    if (!page) {
      const defaultTitle =
        params.slug === "about"
          ? "About Youth Spark India Foundation"
          : params.slug === "impact"
          ? "Our Impact & Measurable Outcomes"
          : params.slug === "privacy-policy"
          ? "Privacy Policy"
          : params.slug === "terms-of-use"
          ? "Terms of Use"
          : "Accessibility Statement";

      page = await prisma.pageContent
        .create({
          data: {
            slug: params.slug,
            title: defaultTitle,
            content: `${defaultTitle} content.`,
            version: 1,
          },
        })
        .catch(async () => {
          return await prisma.pageContent.findUnique({ where: { slug: params.slug } });
        });
    }

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, page });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    if (!ALLOWED_SLUGS.includes(params.slug)) {
      return NextResponse.json(
        { error: "Only the five designated pages (about, impact, privacy-policy, terms-of-use, accessibility) are supported." },
        { status: 400 }
      );
    }

    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { title, subtitle, content, heroImage, metaTitle, metaDescription } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and Content are required" }, { status: 400 });
    }

    const page = await prisma.pageContent.upsert({
      where: { slug: params.slug },
      update: {
        title,
        subtitle: subtitle || null,
        content,
        heroImage: heroImage || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
      },
      create: {
        slug: params.slug,
        title,
        subtitle: subtitle || null,
        content,
        heroImage: heroImage || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
      },
    });

    if (session.id && session.id !== "admin-initial") {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: "pages.edit",
          entity: "PageContent",
          entityId: params.slug,
          details: `Updated static page content for: /${params.slug}`,
        },
      }).catch(() => {});
    }

    revalidatePath(`/${params.slug}`);
    revalidatePath("/about");
    revalidatePath("/impact");
    revalidatePath("/privacy-policy");
    revalidatePath("/terms-of-use");
    revalidatePath("/accessibility");

    return NextResponse.json({ success: true, page });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
