import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';

export class AdminRoleService {
  static async setRole(
    adminUserId: string,
    targetUserId: string,
    role: 'NORMAL' | 'ADMIN'
  ) {
    if (role !== 'NORMAL' && role !== 'ADMIN') {
      throw AppError.badRequest(
        'Papel estrutural inválido. Use assinatura para conceder acesso PRO.',
        'invalid_structural_role'
      );
    }

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
