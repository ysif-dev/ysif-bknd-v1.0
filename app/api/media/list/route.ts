import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { isCloudinaryConfigured } from "@/lib/media/cloudinary";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const folder = searchParams.get("folder") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const skip = (page - 1) * limit;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        assets: [],
        total: 0,
        page,
        totalPages: 0,
        isConfigured: isCloudinaryConfigured(),
      });
    }

    const where: any = {};
    if (folder && folder !== "all") {
      where.folder = folder;
    }
    if (search.trim()) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { altText: { contains: search, mode: "insensitive" } },
        { originalFilename: { contains: search, mode: "insensitive" } },
        { publicId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.mediaAsset.count({ where }),
    ]);

    // Distinct folders
    const distinctFolders = await prisma.mediaAsset.findMany({
      select: { folder: true },
      distinct: ["folder"],
    });

    return NextResponse.json({
      success: true,
      assets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      folders: distinctFolders.map((f) => f.folder).filter(Boolean),
      isConfigured: isCloudinaryConfigured(),
    });
  } catch (error: any) {
    console.error("Fetch media list error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch media assets" },
      { status: 500 }
    );
  }
}
