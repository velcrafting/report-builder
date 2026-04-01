import { prisma } from "@/lib/db/prisma";

export type AuditLogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string | null;
  meta: string;
  createdAt: Date;
};

/**
 * Insert an AuditLog row. Fire-and-forget safe — errors are swallowed.
 */
export async function logAuditEvent(data: {
  action: string;
  entityType: string;
  entityId: string;
  actorId?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        actorId: data.actorId ?? null,
        meta: data.meta ? JSON.stringify(data.meta) : "{}",
      },
    });
  } catch {
    // swallow — audit failures must not break the main action
  }
}

/**
 * List audit events, newest first. Default limit 100.
 */
export async function listAuditEvents(options?: {
  entityType?: string;
  entityId?: string;
  limit?: number;
}): Promise<AuditLogRow[]> {
  return prisma.auditLog.findMany({
    where: {
      ...(options?.entityType ? { entityType: options.entityType } : {}),
      ...(options?.entityId ? { entityId: options.entityId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
  });
}
