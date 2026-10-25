import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { isVisible } = body;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    const updated = await prisma.homepageSection.update({
      where: { id },
      data: { isVisible },
    });

    revalidatePath("/");
    revalidatePath("/admin/homepage");
    return NextResponse.json({ success: true, section: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update section visibility" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { title, subtitle, isVisible, content } = body;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    const updated = await prisma.homepageSection.upsert({
      where: { id },
      update: {
        title,
        subtitle,
        isVisible,
        content,
      },
      create: {
        id,
        title,
        subtitle,
        isVisible: isVisible ?? true,
        content: content || {},
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/homepage");
    return NextResponse.json({ success: true, section: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update section content" },
      { status: 500 }
    );
  }
}
