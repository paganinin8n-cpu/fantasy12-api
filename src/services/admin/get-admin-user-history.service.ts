import { prisma } from '../../lib/prisma'

type HistoryLog = {
  id: string
  source: 'audit' | 'admin'
  action: string
  entity: string
  entityId: string | null
  metadata: unknown
  ipAddress: string | null
  createdAt: Date
  actor: {
    id: string
    name: string
    email: string
  } | null
}

export class GetAdminUserHistoryService {
  static async execute(userId: string) {
    const [auditLogs, adminAuditLogs] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          OR: [
            { userId },
            { entityId: userId },
            { metadata: { path: ['userId'], equals: userId } },
            { metadata: { path: ['targetUserId'], equals: userId } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.adminAuditLog.findMany({
        where: {
          OR: [
            { adminId: userId },
            { entityId: userId },
            { payload: { path: ['userId'], equals: userId } },
            { payload: { path: ['targetUserId'], equals: userId } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          admin: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ])

    const logs: HistoryLog[] = [
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
      .slice(0, 50)

    return {
      meta: {
        total: logs.length,
        limit: 50,
      },
      data: logs,
    }
  }
}
