import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { albumId, title, caption, imageUrl, altText, order } = body;

    if (!albumId || !imageUrl) {
      return NextResponse.json({ error: "Album and image URL are required" }, { status: 400 });
    }

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    const item = await prisma.galleryItem.create({
      data: {
        albumId,
        title: title || "Field Photo",
        caption: caption || null,
        imageUrl,
        altText: altText || title || "Photo",
        order: order || 0,
      },
    });

    revalidatePath("/gallery");
    return NextResponse.json({ success: true, item });
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

    await prisma.galleryItem.delete({ where: { id } });
    revalidatePath("/gallery");
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
