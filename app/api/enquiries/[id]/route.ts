import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isSuperAdmin =
      session.role === "SUPER_ADMIN" || session.appRoleCode === "SUPER_ADMIN";
    const hasDeletePermission = session.permissions?.includes("enquiries.delete") || session.permissions?.includes("*");

    if (!isSuperAdmin && !hasDeletePermission) {
      return NextResponse.json(
        { error: "Forbidden: Super Admin authority required to delete community submissions." },
        { status: 403 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    const deleted = await prisma.contactEnquiry.delete({
      where: { id: params.id },
    });

    if (session.id && session.id !== "admin-initial") {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: "enquiries.delete",
          entity: "ContactEnquiry",
          entityId: params.id,
          details: `Permanently deleted submission from ${deleted.fullName} (${deleted.email})`,
        },
      }).catch(() => {});
    }

    revalidatePath("/admin/enquiries");
    return NextResponse.json({ success: true, deleted: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
