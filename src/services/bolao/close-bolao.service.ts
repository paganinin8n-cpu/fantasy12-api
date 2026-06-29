import { prisma } from '../../lib/prisma';
import { CloseRankingService } from '../ranking/close-ranking.service';
import { AppError } from '../../errors/AppError';

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
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestedByUserId },
      select: { role: true },
    });
    const isAdmin = requestingUser?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw AppError.forbidden('Somente o criador ou um administrador pode encerrar esta Mesa');
    }

    const closeService = new CloseRankingService();
    await closeService.execute(rankingId, { force: true });

    return { closed: true, rankingId };
  }
}
