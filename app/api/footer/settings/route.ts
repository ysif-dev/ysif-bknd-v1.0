import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { footerTagline, footerDescription, copyrightText } = body;

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    const settings = await prisma.siteSetting.upsert({
      where: { id: "default" },
      update: {
        footerTagline,
        footerDescription,
        copyrightText,
      },
      create: {
        id: "default",
        footerTagline,
        footerDescription,
        copyrightText,
      },
    });

    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, settings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
