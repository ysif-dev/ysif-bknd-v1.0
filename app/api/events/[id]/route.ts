import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      title,
      slug,
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

    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        title,
        slug,
        summary,
        description,
        location,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        isVirtual: isVirtual !== undefined ? !!isVirtual : undefined,
        rsvpLink: rsvpLink !== undefined ? (rsvpLink ? rsvpLink.trim() : null) : undefined,
        coverImage,
        status,
      },
    });

    if (session.id && session.id !== "admin-initial") {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: "events.edit",
          entity: "Event",
          entityId: event.id,
          details: `Updated event: ${event.title}`,
        },
      }).catch(() => {});
    }

    revalidatePath("/events");
    revalidatePath(`/events/${event.slug}`);
    revalidatePath("/");
    return NextResponse.json({ success: true, event });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const event = await prisma.event.delete({
      where: { id: params.id },
    });

    if (session.id && session.id !== "admin-initial") {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: "events.delete",
          entity: "Event",
          entityId: params.id,
          details: `Deleted event: ${event.title}`,
        },
      }).catch(() => {});
    }

    revalidatePath("/events");
    revalidatePath("/");
    return NextResponse.json({ success: true, deleted: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
