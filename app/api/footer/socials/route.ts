import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { platform, url, isVisible, displayOrder } = body;

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    const profile = await prisma.socialProfile.create({
      data: {
        platform,
        url,
        isVisible: isVisible ?? true,
        displayOrder: displayOrder || 0,
      },
    });

    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, profile });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, platform, url, isVisible, displayOrder } = body;

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    const profile = await prisma.socialProfile.update({
      where: { id },
      data: {
        platform,
        url,
        isVisible,
        displayOrder,
      },
    });

    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, profile });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    await prisma.socialProfile.delete({ where: { id } });
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
