import { prisma } from "../../lib/prisma";

export class CloseRankingService {
  async execute(rankingId: string): Promise<void> {
    const ranking = await prisma.ranking.findUnique({
      where: { id: rankingId },
      include: {
        participants: {
          include: {
            user: {
              include: {
                scoreHistory: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
        rounds: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!ranking || ranking.status !== 'ACTIVE') {
      return;
    }

    const ordered = ranking.participants.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const aLast = a.user.scoreHistory[0]?.scoreRound ?? 0;
      const bLast = b.user.scoreHistory[0]?.scoreRound ?? 0;
      if (bLast !== aLast) return bLast - aLast;

      const aDate = a.user.scoreHistory[0]?.createdAt.getTime() ?? 0;
      const bDate = b.user.scoreHistory[0]?.createdAt.getTime() ?? 0;
      return aDate - bDate;
    });

    for (let i = 0; i < ordered.length; i++) {
      await prisma.rankingParticipant.update({
        where: { id: ordered[i].id },
        data: {
          position: i + 1,
        },
      });
    }

    await prisma.ranking.update({
      where: { id: rankingId },
      data: {
        status: 'CLOSED',
      },
    });
  }
}
