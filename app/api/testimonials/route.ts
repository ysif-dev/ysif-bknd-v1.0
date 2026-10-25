import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function GET(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        testimonials: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        categories: [],
      });
    }

    const { searchParams } = new URL(request.url);
    const hasPagination = searchParams.has("page") || searchParams.has("limit") || searchParams.has("search") || searchParams.has("category");
    const isAll = searchParams.get("all") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "12", 10) || 12));
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const publicOnly = searchParams.get("publicOnly") !== "false";

    const where: any = {};
    if (publicOnly) {
      where.isVisible = true;
    }
    if (category && category !== "ALL" && category !== "All") {
      where.programmeOrCategory = category;
    }
    if (search) {
      where.OR = [
        { quote: { contains: search, mode: "insensitive" } },
        { authorName: { contains: search, mode: "insensitive" } },
        { roleOrTitle: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    // Baseline categories query for filter tabs
    const rawCategories = await prisma.testimonial.findMany({
      where: publicOnly ? { isVisible: true } : undefined,
      select: { programmeOrCategory: true },
      distinct: ["programmeOrCategory"],
    });
    const categories = rawCategories
      .map((c) => c.programmeOrCategory)
      .filter((c): c is string => typeof c === "string" && c.trim().length > 0);

    // If no pagination requested and not filtering, return full list for backward compatibility
    if (!hasPagination || isAll) {
      const testimonials = await prisma.testimonial.findMany({
        where,
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      });
      return NextResponse.json({
        success: true,
        testimonials,
        pagination: {
          page: 1,
          limit: testimonials.length,
          total: testimonials.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        categories,
      });
    }

    // Paginated & filtered query
    const [total, testimonials] = await Promise.all([
      prisma.testimonial.count({ where }),
      prisma.testimonial.findMany({
        where,
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      testimonials,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      categories,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    if (!quote || !authorName || !roleOrTitle) {
      return NextResponse.json(
        { error: "Quote text, Author Name, and Role/Title are required" },
        { status: 400 }
      );
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        quote,
        authorName,
        roleOrTitle,
        location: location || null,
        avatarUrl: avatarUrl || "/brand/logo.png",
        programmeOrCategory: programmeOrCategory || null,
        displayOrder: Number(displayOrder) || 0,
        isVisible: isVisible !== undefined ? !!isVisible : true,
      },
    });

    if (session.id && session.id !== "admin-initial") {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: "testimonials.create",
          entity: "Testimonial",
          entityId: testimonial.id,
          details: `Added testimonial by: ${testimonial.authorName}`,
        },
      }).catch(() => {});
    }

    revalidatePath("/");
    return NextResponse.json({ success: true, testimonial });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
