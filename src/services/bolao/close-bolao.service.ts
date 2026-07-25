import { prisma } from '../../lib/prisma';
import { CloseRankingService } from '../ranking/close-ranking.service';
import { AppError } from '../../errors/AppError';
import { hasAdminPermission } from '../../security/admin-authorization';

type CloseBolaoInput = {
  rankingId: string;
  requestedByUserId: string;
};

export class CloseBolaoService {
  static async execute({ rankingId, requestedByUserId }: CloseBolaoInput) {
    const bolao = await prisma.ranking.findUnique({
      where: { id: rankingId },
      select: {
        id: true,
        type: true,
        status: true,
        createdByUserId: true,
      },
    });

    if (!bolao || bolao.type !== 'BOLAO') {
      throw AppError.notFound('Mesa não encontrada');
    }

    if (bolao.status === 'CLOSED') {
      throw AppError.badRequest('Esta Mesa já está encerrada');
    }

    const isOwner = bolao.createdByUserId === requestedByUserId;
    const canForceSettlement = isOwner
      ? false
      : await hasAdminPermission(requestedByUserId, 'COMPETITION_EXECUTE');

    if (!isOwner && !canForceSettlement) {
      await prisma.adminAuditLog.create({
        data: {
          adminId: requestedByUserId,
          action: 'MESA_FORCE_SETTLEMENT_DENIED',
          entity: 'RANKING',
          entityId: rankingId,
          payload: { permissionCode: 'COMPETITION_EXECUTE' },
        },
      });
      throw AppError.forbidden('Somente o criador ou um administrador pode encerrar esta Mesa');
    }

    const closeService = new CloseRankingService();
    await closeService.execute(rankingId, { force: true });

    if (canForceSettlement) {
      await prisma.adminAuditLog.create({
        data: {
          adminId: requestedByUserId,
          action: 'MESA_FORCE_SETTLEMENT_GRANTED',
          entity: 'RANKING',
          entityId: rankingId,
          payload: { permissionCode: 'COMPETITION_EXECUTE' },
        },
      });
    }

    return { closed: true, rankingId };
  }
}
