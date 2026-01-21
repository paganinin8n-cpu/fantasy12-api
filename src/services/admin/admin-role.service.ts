import { prisma } from '../../lib/prisma';

export class AdminRoleService {
  static async setRole(
    adminUserId: string,
    targetUserId: string,
    role: 'NORMAL' | 'PRO' | 'ADMIN'
  ) {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'ADMIN_SET_ROLE',
        entity: 'User',
        entityId: targetUserId,
        metadata: { role },
      },
    });

    return { userId: targetUserId, role };
  }
}
