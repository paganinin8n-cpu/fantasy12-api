import { prisma } from '../../lib/prisma';

export class CloseRankingService {
  async execute(rankingId: string) {
    const ranking = await prisma.ranking.findUnique({
      where: { id: rankingId },
      include: { participants: true },
    });

    if (!ranking) {
      throw new Error('Ranking não encontrado');
    }

    if (ranking.status !== 'ACTIVE') {
      throw new Error('Ranking já está encerrado');
    }

    if (!ranking.endDate || ranking.endDate > new Date()) {
      throw new Error('Ranking ainda não expirou');
    }

    const results: {
      participantId: string;
      userId: string;
      scoreRanking: number;
      scoreFinal: number;
    }[] = [];

    for (const participant of ranking.participants) {
      const lastHistory = await prisma.userScoreHistory.findFirst({
        where: {
          userId: participant.userId,
          createdAt: { lte: ranking.endDate },
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

    results.sort((a, b) => {
      if (b.scoreRanking !== a.scoreRanking) {
        return b.scoreRanking - a.scoreRanking;
      }
      if (b.scoreFinal !== a.scoreFinal) {
        return b.scoreFinal - a.scoreFinal;
      }
      return a.userId.localeCompare(b.userId);
    });

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

      await tx.ranking.update({
        where: { id: rankingId },
        data: { status: 'CLOSED' },
      });
    });
  }
}
