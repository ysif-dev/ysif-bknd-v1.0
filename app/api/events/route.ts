import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true, events: [] });
    }

    const events = await prisma.event.findMany({
      orderBy: { startDate: "desc" },
    });
    return NextResponse.json({ success: true, events });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      title,
      summary,
      description,
      location,
      startDate,
      endDate,
      isVirtual,
      rsvpLink,
      coverImage,
      status,
    } = body;

    if (!title || !startDate || !location) {
      return NextResponse.json(
        { error: "Title, Start Date, and Location are required" },
        { status: 400 }
      );
    }

    const baseSlug = slugify(title);
    let slug = baseSlug;
    if (isDatabaseConfigured()) {
      const existing = await prisma.event.findUnique({ where: { slug } });
      if (existing) {
        slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      }
    }

    const event = await prisma.event.create({
      data: {
        slug,
        title,
        summary: summary || "",
        description: description || "",
        location,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isVirtual: !!isVirtual,
        rsvpLink: rsvpLink ? rsvpLink.trim() : null,
        coverImage: coverImage || "/brand/logo.png",
        status: status || "PUBLISHED",
      },
    });

    // Record audit log
    if (session.id && session.id !== "admin-initial") {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: "events.create",
          entity: "Event",
          entityId: event.id,
          details: `Created event: ${event.title} (Slug: ${event.slug})`,
        },
      }).catch(() => {});
    }

    revalidatePath("/events");
    revalidatePath("/");
    return NextResponse.json({ success: true, event });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
