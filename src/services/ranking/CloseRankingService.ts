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
                  take: 1
                }
              }
            }
          }
        },
        rounds: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    if (!ranking || !ranking.isActive) {
      return;
    }

    const ordered = ranking.participants.sort((a, b) => {
      // 1️⃣ score total
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      // 2️⃣ scoreRound da última rodada
      const aLast = a.user.scoreHistory[0]?.scoreRound ?? 0;
      const bLast = b.user.scoreHistory[0]?.scoreRound ?? 0;

      if (bLast !== aLast) {
        return bLast - aLast;
      }

      // 3️⃣ createdAt do histórico
      const aDate = a.user.scoreHistory[0]?.createdAt.getTime() ?? 0;
      const bDate = b.user.scoreHistory[0]?.createdAt.getTime() ?? 0;

      return aDate - bDate;
    });

    // Persistir snapshot de posição
    for (let i = 0; i < ordered.length; i++) {
      await prisma.rankingParticipant.update({
        where: { id: ordered[i].id },
        data: {
          position: i + 1
        }
      });
    }

    // Encerrar ranking
    await prisma.ranking.update({
      where: { id: rankingId },
      data: {
        isActive: false
      }
    });
  }
}
