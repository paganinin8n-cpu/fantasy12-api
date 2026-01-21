import { prisma } from '../../lib/prisma';

export class CloseRankingService {
  async execute(rankingId: string) {
    // 1️⃣ Buscar ranking
    const ranking = await prisma.ranking.findUnique({
      where: { id: rankingId },
      include: {
        participants: true,
      },
    });

    if (!ranking) {
      throw new Error('Ranking não encontrado');
    }

    if (!ranking.isActive) {
      throw new Error('Ranking já está encerrado');
    }

    if (!ranking.endDate || ranking.endDate > new Date()) {
      throw new Error('Ranking ainda não expirou');
    }

    // 2️⃣ Para cada participante, calcular score final
    const results = [];

    for (const participant of ranking.participants) {
      // último histórico ATÉ o fim do ranking
      const lastHistory = await prisma.userScoreHistory.findFirst({
        where: {
          userId: participant.userId,
          createdAt: {
            lte: ranking.endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const scoreFinal = lastHistory?.scoreTotal ?? participant.scoreInitial;
      const scoreRanking = scoreFinal - participant.scoreInitial;

      results.push({
        participantId: participant.id,
        userId: participant.userId,
        scoreRanking,
        scoreFinal,
      });
    }

    // 3️⃣ Ordenação + desempate (ordem já definida)
    results.sort((a, b) => {
      // Critério 1 — maior score do ranking
      if (b.scoreRanking !== a.scoreRanking) {
        return b.scoreRanking - a.scoreRanking;
      }

      // Critério 2 — maior scoreTotal geral
      if (b.scoreFinal !== a.scoreFinal) {
        return b.scoreFinal - a.scoreFinal;
      }

      return 0;
    });

    // 4️⃣ Persistir posição e score
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < results.length; i++) {
        await tx.rankingParticipant.update({
          where: { id: results[i].participantId },
          data: {
            score: results[i].scoreRanking,
            position: i + 1,
          },
        });
      }

      // 5️⃣ Encerrar ranking
      await tx.ranking.update({
        where: { id: rankingId },
        data: {
          isActive: false,
        },
      });
    });
  }
}
