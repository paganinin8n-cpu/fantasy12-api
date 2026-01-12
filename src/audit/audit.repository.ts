import { prisma } from '../lib/prisma';

interface CreateAuditLogData {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

interface LogAuditData {
  userId: string;
  action: string;
  metadata?: any;
  entity?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditRepository {
  // Método log (usado pelo service)
  async log(data: LogAuditData) {
    return prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity || 'SYSTEM',  // Default se não passar
        entityId: data.entityId,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      }
    });
  }

  // Método create (alias para log)
  async create(data: CreateAuditLogData) {
    return this.log(data);
  }

  async findMany(filters?: {
    userId?: string;
    entity?: string;
    limit?: number;
  }) {
    return prisma.auditLog.findMany({
      where: {
        userId: filters?.userId,
        entity: filters?.entity
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: filters?.limit || 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async findById(id: string) {
    return prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }
}