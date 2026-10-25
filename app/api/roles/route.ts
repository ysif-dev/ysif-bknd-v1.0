import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true, roles: [], allPermissions: [] });
    }

    const [roles, allPermissions] = await Promise.all([
      prisma.appRole.findMany({
        include: {
          permissions: {
            include: { permission: true },
          },
          _count: {
            select: { users: true },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.permission.findMany({
        orderBy: [{ module: "asc" }, { action: "asc" }],
      }),
    ]);

    return NextResponse.json({ success: true, roles, allPermissions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, code, description, permissionIds } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Role name and unique code are required" }, { status: 400 });
    }

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    const role = await prisma.appRole.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        description: description || null,
        isSystem: false,
      },
    });

    if (Array.isArray(permissionIds) && permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((pId) => ({ roleId: role.id, permissionId: pId })),
      });
    }

    revalidatePath("/admin/roles");
    return NextResponse.json({ success: true, role });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, name, description, permissionIds } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "ID and role name are required" }, { status: 400 });
    }

    if (!isDatabaseConfigured()) return NextResponse.json({ success: true });

    const role = await prisma.appRole.update({
      where: { id },
      data: { name, description },
    });

    if (Array.isArray(permissionIds)) {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((pId) => ({ roleId: id, permissionId: pId })),
        });
      }
    }

    revalidatePath("/admin/roles");
    return NextResponse.json({ success: true, role });
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

    const role = await prisma.appRole.findUnique({ where: { id } });
    if (role?.isSystem) {
      return NextResponse.json({ error: "System roles cannot be deleted" }, { status: 400 });
    }

    await prisma.appRole.delete({ where: { id } });
    revalidatePath("/admin/roles");
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
