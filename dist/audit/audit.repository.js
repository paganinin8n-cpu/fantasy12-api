"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditRepository = void 0;
const prisma_1 = require("../lib/prisma");
class AuditRepository {
    // Método log (usado pelo service)
    async log(data) {
        return prisma_1.prisma.auditLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                entity: data.entity || 'SYSTEM', // Default se não passar
                entityId: data.entityId,
                metadata: data.metadata,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent
            }
        });
    }
    // Método create (alias para log)
    async create(data) {
        return this.log(data);
    }
    async findMany(filters) {
        return prisma_1.prisma.auditLog.findMany({
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
    async findById(id) {
        return prisma_1.prisma.auditLog.findUnique({
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
exports.AuditRepository = AuditRepository;
