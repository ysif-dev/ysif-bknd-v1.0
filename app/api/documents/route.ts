import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { getPublicDocuments } from "@/lib/dal";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      const documents = await getPublicDocuments();
      return NextResponse.json({ success: true, documents });
    }

    const documents = await prisma.publicDocument.findMany({
      orderBy: { publishedAt: "desc" },
    });
    return NextResponse.json({ success: true, documents });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { title, category, fileUrl, fileSize, fileType, version, status } = body;

    if (!title || !fileUrl) {
      return NextResponse.json({ error: "Title and file URL are required" }, { status: 400 });
    }

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    const document = await prisma.publicDocument.create({
      data: {
        title,
        category: category || "Policy",
        fileUrl,
        fileSize: fileSize || "1.0 MB",
        fileType: fileType || "PDF",
        version: version || "1.0",
        status: status || "PUBLISHED",
      },
    });

    revalidatePath("/transparency");
    return NextResponse.json({ success: true, document });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, title, category, fileUrl, fileSize, fileType, version, status } = body;

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    const document = await prisma.publicDocument.update({
      where: { id },
      data: {
        title,
        category,
        fileUrl,
        fileSize,
        fileType,
        version,
        status,
      },
    });

    revalidatePath("/transparency");
    return NextResponse.json({ success: true, document });
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

    await prisma.publicDocument.delete({ where: { id } });
    revalidatePath("/transparency");
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
