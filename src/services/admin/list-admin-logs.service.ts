import { prisma } from '../../lib/prisma'

type ListAdminLogsInput = {
  entity?: string
  userId?: string
  limit?: number
}

export class ListAdminLogsService {
  static async execute(input: ListAdminLogsInput) {
    const limit = input.limit && input.limit > 0 && input.limit <= 200 ? input.limit : 100

    const [auditLogs, adminAuditLogs] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          ...(input.userId ? { userId: input.userId } : {}),
          ...(input.entity ? { entity: input.entity } : {}),
        },
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
      prisma.adminAuditLog.findMany({
        where: {
          ...(input.userId ? { adminId: input.userId } : {}),
          ...(input.entity ? { entity: input.entity } : {}),
        },
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
      },
      data: combined,
    }
  }
}
