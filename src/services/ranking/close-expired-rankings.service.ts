import { prisma } from '../../lib/prisma';
import { CloseRankingService } from './close-ranking.service';

export class CloseExpiredRankingsService {
  async execute(): Promise<{ closed: number }> {
    const now = new Date();

    /**
     * 1️⃣ Buscar rankings expirados
     */
    const expiredRankings = await prisma.ranking.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          not: null,
          lt: now,
        },
      },
      select: {
        id: true,
      },
    });

    if (expiredRankings.length === 0) {
      return { closed: 0 };
    }

    const closeService = new CloseRankingService();

    let closedCount = 0;

    /**
     * 2️⃣ Fechar um por um usando serviço oficial
     */
    for (const ranking of expiredRankings) {
      try {
        await closeService.execute(ranking.id);
        closedCount++;
      } catch (error) {
        /**
         * Não interrompe o processamento de outros rankings
         * Pode futuramente logar via AuditLog
         */
        console.error(
          `Erro ao fechar ranking ${ranking.id}:`,
          error
        );
      }
    }

    return { closed: closedCount };
  }
}
