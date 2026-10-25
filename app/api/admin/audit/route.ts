import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  getAuditLogs,
  deleteAuditRecords,
  getAuditDeletionTrail,
  extractClientInfo,
  recordAuditEvent,
} from "@/lib/admin/audit";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pageSize")) || 25;
    const category = searchParams.get("category") || undefined;
    const outcome = searchParams.get("outcome") || undefined;
    const action = searchParams.get("action") || undefined;
    const search = searchParams.get("search") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const includeTrail = searchParams.get("includeTrail") === "true";

    const result = await getAuditLogs({
      page,
      pageSize,
      category,
      outcome,
      action,
      search,
      startDate,
      endDate,
    });

    let deletionTrail: any[] = [];
    if (includeTrail) {
      deletionTrail = await getAuditDeletionTrail(25);
    }

    return NextResponse.json({
      success: true,
      ...result,
      deletionTrail,
    });
  } catch (error: any) {
    console.error("GET /api/admin/audit error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve audit records." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { ipAddress, userAgent } = extractClientInfo(request);

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin =
      session.role === "SUPER_ADMIN" ||
      (session as any).appRoleCode === "SUPER_ADMIN";

    if (!isSuperAdmin) {
      await recordAuditEvent({
        actor: {
          id: session.id,
          email: session.email,
          name: session.name,
          role: session.role,
        },
        action: "AUDIT_DELETE_UNAUTHORIZED",
        category: "SECURITY",
        entity: "AuditLog",
        outcome: "DENIED",
        targetLabel: "Unauthorized audit purge attempt",
        details: `User with role ${session.role} attempted to delete audit logs. Access denied.`,
        failureReason: "User is not a SUPER_ADMIN.",
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        { error: "Forbidden: Only Super Administrators have authority to delete forensic audit logs." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { recordIds, deleteAll, olderThan, reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "A valid, mandatory justification (minimum 5 characters) is required to purge forensic logs." },
        { status: 400 }
      );
    }

    const deleteResult = await deleteAuditRecords({
      superAdmin: {
        id: session.id,
        email: session.email,
        name: session.name,
        role: "SUPER_ADMIN",
      },
      recordIds: Array.isArray(recordIds) ? recordIds : undefined,
      deleteAll: Boolean(deleteAll),
      olderThan,
      reason,
      ipAddress,
      userAgent,
    });

    if (!deleteResult.success) {
      return NextResponse.json(
        { error: deleteResult.error || "Failed to delete audit records." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.deletedCount,
      message: `Successfully purged ${deleteResult.deletedCount} audit record(s). Deletion evidence preserved in AuditDeletionLog.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/audit error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during audit deletion." },
      { status: 500 }
    );
  }
}
