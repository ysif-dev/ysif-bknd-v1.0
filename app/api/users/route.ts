import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true, users: [], roles: [] });
    }

    const [users, roles] = await Promise.all([
      prisma.adminUser.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          appRoleId: true,
          appRole: {
            select: { id: true, name: true, code: true },
          },
          isActive: true,
          otpEnabled: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.appRole.findMany({
        select: { id: true, name: true, code: true, description: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ success: true, users, roles });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, email, password, appRoleId, isActive, otpEnabled } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    const existing = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email address already exists" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.adminUser.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        appRoleId: appRoleId || null,
        isActive: isActive ?? true,
        otpEnabled: Boolean(otpEnabled),
        role: "EDITOR",
      },
    });

    if (session.id && session.id !== "admin-initial") {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: "admin.create",
          entity: "AdminUser",
          entityId: user.id,
          details: JSON.stringify({ email: user.email, otpEnabled: user.otpEnabled }),
        },
      }).catch(() => {});
    }

    revalidatePath("/admin/users");
    return NextResponse.json({ success: true, user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, name, email, password, appRoleId, isActive, otpEnabled } = body;

    if (!id || !name || !email) {
      return NextResponse.json({ error: "ID, name, and email are required" }, { status: 400 });
    }

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    const existing = await prisma.adminUser.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {
      name,
      email: email.toLowerCase(),
      appRoleId: appRoleId || null,
      isActive: isActive ?? true,
    };

    if (password && password.trim().length >= 8) {
      updateData.passwordHash = await hashPassword(password);
    }

    // Handle per-admin Email OTP toggle
    if (otpEnabled !== undefined && Boolean(otpEnabled) !== existing.otpEnabled) {
      const isSuperAdmin =
        session.role === "SUPER_ADMIN" || session.appRoleCode === "SUPER_ADMIN";
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: "Only Super Administrators can modify individual administrator OTP policies" },
          { status: 403 }
        );
      }

      updateData.otpEnabled = Boolean(otpEnabled);

      // Record strict audit log
      if (session.id && session.id !== "admin-initial") {
        await prisma.auditLog.create({
          data: {
            userId: session.id,
            action: "admin.otp_toggle",
            entity: "AdminUser",
            entityId: id,
            details: JSON.stringify({
              actorEmail: session.email,
              targetEmail: existing.email,
              oldValue: existing.otpEnabled,
              newValue: Boolean(otpEnabled),
              timestamp: new Date().toISOString(),
            }),
          },
        }).catch(() => {});
      }
    }

    const user = await prisma.adminUser.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/users");
    return NextResponse.json({ success: true, user });
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

    if (session.id === id) {
      return NextResponse.json({ error: "Cannot delete your own active administrator account" }, { status: 400 });
    }

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    await prisma.adminUser.delete({ where: { id } });
    revalidatePath("/admin/users");
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
