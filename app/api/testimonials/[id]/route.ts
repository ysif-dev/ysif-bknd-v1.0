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
      quote,
      authorName,
      roleOrTitle,
      location,
      avatarUrl,
      programmeOrCategory,
      displayOrder,
      isVisible,
    } = body;

    const testimonial = await prisma.testimonial.update({
      where: { id: params.id },
      data: {
        quote,
        authorName,
        roleOrTitle,
        location: location !== undefined ? (location ? location.trim() : null) : undefined,
        avatarUrl,
        programmeOrCategory: programmeOrCategory !== undefined ? (programmeOrCategory ? programmeOrCategory.trim() : null) : undefined,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : undefined,
        isVisible: isVisible !== undefined ? !!isVisible : undefined,
      },
    });

    if (session.id && session.id !== "admin-initial") {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: "testimonials.edit",
          entity: "Testimonial",
          entityId: testimonial.id,
          details: `Updated testimonial for: ${testimonial.authorName}`,
        },
      }).catch(() => {});
    }

    revalidatePath("/");
    return NextResponse.json({ success: true, testimonial });
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

    const testimonial = await prisma.testimonial.delete({
      where: { id: params.id },
    });

    if (session.id && session.id !== "admin-initial") {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: "testimonials.delete",
          entity: "Testimonial",
          entityId: params.id,
          details: `Deleted testimonial for: ${testimonial.authorName}`,
        },
      }).catch(() => {});
    }

    revalidatePath("/");
    return NextResponse.json({ success: true, deleted: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
