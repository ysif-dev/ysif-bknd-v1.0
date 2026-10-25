import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { getLeadershipProfiles } from "@/lib/dal";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      const profiles = await getLeadershipProfiles();
      return NextResponse.json({ success: true, profiles });
    }

    const profiles = await prisma.leadershipProfile.findMany({
      orderBy: { displayOrder: "asc" },
    });
    return NextResponse.json({ success: true, profiles });
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
      fullName,
      roleType,
      designation,
      portraitUrl,
      signatureUrl,
      shortIntro,
      biography,
      founderMessage,
      responsibilities,
      linkedinUrl,
      twitterUrl,
      email,
      displayOrder,
      isFeatured,
      status,
    } = body;

    if (!fullName || !designation) {
      return NextResponse.json({ error: "Full Name and Designation are required" }, { status: 400 });
    }

    const slug = slugify(fullName) + "-" + Date.now().toString().slice(-4);

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    const profile = await prisma.leadershipProfile.create({
      data: {
        slug,
        fullName,
        roleType: roleType || "TEAM",
        designation,
        portraitUrl,
        signatureUrl: signatureUrl || null,
        shortIntro: shortIntro || null,
        biography: biography || "",
        founderMessage: founderMessage || null,
        responsibilities: responsibilities || [],
        linkedinUrl: linkedinUrl || null,
        twitterUrl: twitterUrl || null,
        email: email || null,
        displayOrder: displayOrder || 0,
        isFeatured: isFeatured ?? false,
        status: status || "PUBLISHED",
      },
    });

    revalidatePath("/about");
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
    const {
      id,
      fullName,
      roleType,
      designation,
      portraitUrl,
      signatureUrl,
      shortIntro,
      biography,
      founderMessage,
      responsibilities,
      linkedinUrl,
      twitterUrl,
      email,
      displayOrder,
      isFeatured,
      status,
    } = body;

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    const profile = await prisma.leadershipProfile.update({
      where: { id },
      data: {
        fullName,
        roleType,
        designation,
        portraitUrl,
        signatureUrl,
        shortIntro,
        biography,
        founderMessage,
        responsibilities,
        linkedinUrl,
        twitterUrl,
        email,
        displayOrder,
        isFeatured,
        status,
      },
    });

    revalidatePath("/about");
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

    await prisma.leadershipProfile.delete({ where: { id } });
    revalidatePath("/about");
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
