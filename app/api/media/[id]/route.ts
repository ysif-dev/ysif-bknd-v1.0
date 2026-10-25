import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { deleteFromCloudinary } from "@/lib/media/cloudinary";

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
    const { title, altText, caption, folder } = body;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const updated = await prisma.mediaAsset.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(altText !== undefined ? { altText } : {}),
        ...(caption !== undefined ? { caption } : {}),
        ...(folder !== undefined ? { folder } : {}),
      },
    });

    return NextResponse.json({ success: true, asset: updated });
  } catch (error: any) {
    console.error("Update media asset error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update media asset" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const result = await deleteFromCloudinary(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete media asset error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete media asset" },
      { status: 500 }
    );
  }
}
