import { prisma, isDatabaseConfigured } from "../db/prisma";

export interface AuditActor {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
}

export type AuditCategory =
  | "AUTH"
  | "ADMIN_MANAGEMENT"
  | "MEDIA"
  | "CMS_EDIT"
  | "SECURITY"
  | "SYSTEM"
  | "GENERAL";

export type AuditOutcome = "SUCCESS" | "FAILURE" | "DENIED";

export interface RecordAuditParams {
  actor?: AuditActor | null;
  action: string;
  category?: AuditCategory;
  entity: string;
  entityId?: string | null;
  targetLabel?: string | null;
  details?: string | null;
  outcome?: AuditOutcome;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | null;
  failureReason?: string | null;
}

export function extractClientInfo(requestOrHeaders: Request | Headers): {
  ipAddress: string;
  userAgent: string;
} {
  try {
    const headers =
      requestOrHeaders instanceof Request
        ? requestOrHeaders.headers
        : requestOrHeaders;

    const forwardedFor = headers.get("x-forwarded-for");
    let ipAddress = "127.0.0.1";
    if (forwardedFor) {
      ipAddress = forwardedFor.split(",")[0].trim();
    } else {
      ipAddress =
        headers.get("x-real-ip") ||
        headers.get("cf-connecting-ip") ||
        "127.0.0.1";
    }

    const userAgent = headers.get("user-agent") || "Unknown Client";
    return { ipAddress, userAgent };
  } catch {
    return { ipAddress: "127.0.0.1", userAgent: "Unknown Client" };
  }
}

/**
 * Records a rich forensic audit log entry in the persistent database.
 */
export async function recordAuditEvent(params: RecordAuditParams) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  try {
    let validUserId: string | null = null;
    if (params.actor?.id && params.actor.id !== "admin-initial") {
      const exists = await prisma.adminUser.findUnique({
        where: { id: params.actor.id },
        select: { id: true },
      }).catch(() => null);
      if (exists) validUserId = exists.id;
    }

    const log = await prisma.auditLog.create({
      data: {
        userId: validUserId,
        actorEmail: params.actor?.email || null,
        actorName: params.actor?.name || null,
        actorRole: params.actor?.role || null,
        action: params.action,
        category: params.category || "GENERAL",
        entity: params.entity,
        entityId: params.entityId || null,
        targetLabel: params.targetLabel || null,
        details: params.details || null,
        outcome: params.outcome || "SUCCESS",
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        metadata: params.metadata || undefined,
        failureReason: params.failureReason || null,
      },
    });

    return log;
  } catch (error) {
    console.error("[AuditLog] Failed to persist forensic audit event:", error);
    return null;
  }
}

export interface GetAuditLogsFilter {
  page?: number;
  pageSize?: number;
  category?: string;
  outcome?: string;
  action?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export async function getAuditLogs(filters: GetAuditLogsFilter = {}) {
  if (!isDatabaseConfigured()) {
    return { logs: [], total: 0, page: 1, pageSize: 25, totalPages: 0 };
  }

  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 25));
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (filters.category && filters.category !== "ALL") {
    where.category = filters.category;
  }

  if (filters.outcome && filters.outcome !== "ALL") {
    where.outcome = filters.outcome;
  }

  if (filters.action && filters.action.trim()) {
    where.action = { contains: filters.action.trim(), mode: "insensitive" };
  }

  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { actorEmail: { contains: q, mode: "insensitive" } },
      { actorName: { contains: q, mode: "insensitive" } },
      { targetLabel: { contains: q, mode: "insensitive" } },
      { details: { contains: q, mode: "insensitive" } },
      { entity: { contains: q, mode: "insensitive" } },
      { entityId: { contains: q, mode: "insensitive" } },
    ];
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  try {
    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("[AuditLog] Failed to fetch audit logs:", error);
    return { logs: [], total: 0, page, pageSize, totalPages: 0 };
  }
}

/**
 * Super Admin-Only Audit Deletion.
 * Enforces strict role verification and writes tamper-evident proof to AuditDeletionLog before purging.
 */
export async function deleteAuditRecords(params: {
  superAdmin: { id?: string | null; email: string; name?: string | null; role: string };
  recordIds?: string[];
  deleteAll?: boolean;
  olderThan?: Date | string;
  reason: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  if (!isDatabaseConfigured()) {
    return { success: false, deletedCount: 0, error: "Database is not connected." };
  }

  // 1. Strict Super Admin Check
  const isSuperAdmin =
    params.superAdmin.role === "SUPER_ADMIN" ||
    (params.superAdmin as any).appRoleCode === "SUPER_ADMIN";

  if (!isSuperAdmin) {
    // Record unauthorized attempt as a high-severity security audit event
    await recordAuditEvent({
      actor: params.superAdmin,
      action: "AUDIT_PURGE_DENIED",
      category: "SECURITY",
      entity: "AuditLog",
      outcome: "DENIED",
      targetLabel: `Unauthorized purge attempt by ${params.superAdmin.email}`,
      details: `Attempted to purge audit logs with reason: ${params.reason}`,
      failureReason: "User is not a SUPER_ADMIN. Authority denied.",
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return {
      success: false,
      deletedCount: 0,
      error: "Forbidden: Only Super Administrators have authority to purge forensic audit records.",
    };
  }

  // 2. Mandatory Reason Validation
  if (!params.reason || params.reason.trim().length < 5) {
    return {
      success: false,
      deletedCount: 0,
      error: "A mandatory justification (minimum 5 characters) is required to purge forensic logs.",
    };
  }

  try {
    const whereClause: any = {};

    if (Array.isArray(params.recordIds) && params.recordIds.length > 0) {
      whereClause.id = { in: params.recordIds };
    } else if (params.olderThan) {
      whereClause.createdAt = { lt: new Date(params.olderThan) };
    } else if (!params.deleteAll) {
      return {
        success: false,
        deletedCount: 0,
        error: "Please specify record IDs, an expiration date, or confirm full purge.",
      };
    }

    const targetRecords = await prisma.auditLog.findMany({
      where: whereClause,
      select: { id: true },
      take: 2000,
    });

    if (targetRecords.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    const targetIds = targetRecords.map((r) => r.id);

    let validSuperAdminId: string | null = null;
    if (params.superAdmin.id && params.superAdmin.id !== "admin-initial") {
      const exists = await prisma.adminUser.findUnique({
        where: { id: params.superAdmin.id },
        select: { id: true },
      }).catch(() => null);
      if (exists) validSuperAdminId = exists.id;
    }

    // 3. Persist Deletion Trail in AuditDeletionLog (TAMPER-EVIDENT - NEVER DELETED)
    await prisma.auditDeletionLog.create({
      data: {
        deletedByUserId: validSuperAdminId,
        deletedByEmail: params.superAdmin.email,
        deletedByName: params.superAdmin.name || "Super Administrator",
        deletedByRole: "SUPER_ADMIN",
        recordCount: targetIds.length,
        deletedRecordIds: targetIds,
        reason: params.reason.trim(),
        filterCriteria: {
          specifiedIdsCount: params.recordIds?.length || 0,
          deleteAll: Boolean(params.deleteAll),
          olderThan: params.olderThan ? String(params.olderThan) : null,
        },
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });

    // 4. Perform actual deletion of the specified audit records
    const deleteResult = await prisma.auditLog.deleteMany({
      where: {
        id: { in: targetIds },
      },
    });

    // 5. Create a brand-new post-deletion audit event so live auditing continues unbroken
    await prisma.auditLog.create({
      data: {
        userId: validSuperAdminId,
        actorEmail: params.superAdmin.email,
        actorName: params.superAdmin.name || "Super Administrator",
        actorRole: "SUPER_ADMIN",
        action: "AUDIT_RECORDS_PURGED",
        category: "SECURITY",
        entity: "AuditLog",
        targetLabel: `${deleteResult.count} records purged`,
        details: `Super Admin purged ${deleteResult.count} audit records. Justification: "${params.reason.trim()}". Evidence permanently preserved in AuditDeletionLog.`,
        outcome: "SUCCESS",
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        metadata: {
          purgedCount: deleteResult.count,
          reason: params.reason.trim(),
        },
      },
    });

    return { success: true, deletedCount: deleteResult.count };
  } catch (error: any) {
    console.error("[AuditLog] Error purging audit records:", error);
    return {
      success: false,
      deletedCount: 0,
      error: error?.message || "Failed to purge audit records.",
    };
  }
}

/**
 * Retrieve durable deletion evidence records from AuditDeletionLog
 */
export async function getAuditDeletionTrail(limit: number = 50) {
  if (!isDatabaseConfigured()) return [];
  try {
    return await prisma.auditDeletionLog.findMany({
      orderBy: { deletedAt: "desc" },
      take: limit,
    });
  } catch (e) {
    console.error("[AuditLog] Error retrieving deletion trail:", e);
    return [];
  }
}
