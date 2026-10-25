import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true, albums: [] });
    }

    const albums = await prisma.galleryAlbum.findMany({
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, albums });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { title, description, coverImage, status } = body;

    if (!title || !coverImage) {
      return NextResponse.json({ error: "Title and cover image are required" }, { status: 400 });
    }

    const slug = slugify(title) + "-" + Date.now().toString().slice(-4);

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    const album = await prisma.galleryAlbum.create({
      data: {
        slug,
        title,
        description: description || null,
        coverImage,
        status: status || "PUBLISHED",
      },
    });

    revalidatePath("/gallery");
    return NextResponse.json({ success: true, album });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, title, description, coverImage, status } = body;

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    const album = await prisma.galleryAlbum.update({
      where: { id },
      data: {
        title,
        description,
        coverImage,
        status,
      },
    });

    revalidatePath("/gallery");
    return NextResponse.json({ success: true, album });
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

    await prisma.galleryAlbum.delete({ where: { id } });
    revalidatePath("/gallery");
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
