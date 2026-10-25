import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { getNavigationItems } from "@/lib/dal";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      const items = await getNavigationItems();
      return NextResponse.json({ success: true, items });
    }

    const items = await prisma.navigationItem.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ success: true, items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { label, href, order, isVisible, isExternal } = body;

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    const item = await prisma.navigationItem.create({
      data: {
        label,
        href,
        order: order || 0,
        isVisible: isVisible ?? true,
        isExternal: isExternal ?? false,
      },
    });

    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, item });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, label, href, order, isVisible, isExternal } = body;

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    const item = await prisma.navigationItem.update({
      where: { id },
      data: {
        label,
        href,
        order,
        isVisible,
        isExternal,
      },
    });

    revalidatePath("/", "layout");
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

    await prisma.navigationItem.delete({ where: { id } });
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
