import { prisma } from '../../lib/prisma'

type ListAdminLogsInput = {
  entity?: string
  entityId?: string
  action?: string
  source?: 'audit' | 'admin' | 'all'
  userId?: string
  limit?: number
}

export class ListAdminLogsService {
  static async execute(input: ListAdminLogsInput) {
    const limit = input.limit && input.limit > 0 && input.limit <= 200 ? input.limit : 100
    const source = input.source ?? 'all'

    const auditWhere = {
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.entity ? { entity: { contains: input.entity, mode: 'insensitive' as const } } : {}),
      ...(input.entityId ? { entityId: input.entityId } : {}),
      ...(input.action ? { action: { contains: input.action, mode: 'insensitive' as const } } : {}),
    }

    const adminAuditWhere = {
      ...(input.userId ? { adminId: input.userId } : {}),
      ...(input.entity ? { entity: { contains: input.entity, mode: 'insensitive' as const } } : {}),
      ...(input.entityId ? { entityId: input.entityId } : {}),
      ...(input.action ? { action: { contains: input.action, mode: 'insensitive' as const } } : {}),
    }

    const [auditLogs, adminAuditLogs] = await Promise.all([
      source === 'admin'
        ? Promise.resolve([])
        : prisma.auditLog.findMany({
            where: auditWhere,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          }),
      source === 'audit'
        ? Promise.resolve([])
        : prisma.adminAuditLog.findMany({
            where: adminAuditWhere,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
              admin: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          }),
    ])

    const combined = [
      ...auditLogs.map(item => ({
        id: item.id,
        source: 'audit' as const,
        action: item.action,
        entity: item.entity,
        entityId: item.entityId,
        metadata: item.metadata,
        ipAddress: item.ipAddress,
        createdAt: item.createdAt,
        actor: item.user
          ? {
              id: item.user.id,
              name: item.user.name,
              email: item.user.email,
            }
          : null,
      })),
      ...adminAuditLogs.map(item => ({
        id: item.id,
        source: 'admin' as const,
        action: item.action,
        entity: item.entity,
        entityId: item.entityId,
        metadata: item.payload,
        ipAddress: item.ipAddress,
        createdAt: item.createdAt,
        actor: {
          id: item.admin.id,
          name: item.admin.name,
          email: item.admin.email,
        },
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)

    return {
      meta: {
        total: combined.length,
        limit,
        filters: {
          entity: input.entity ?? null,
          entityId: input.entityId ?? null,
          action: input.action ?? null,
          source,
          userId: input.userId ?? null,
        },
      },
      data: combined,
    }
  }
}
