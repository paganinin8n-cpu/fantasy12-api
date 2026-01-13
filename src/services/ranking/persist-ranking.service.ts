import { prisma } from '../../lib/prisma';
import { CalculateRankingService } from './calculate-ranking.service';

interface PersistRankingInput {
  rankingId: string;
  rankingStartDate: Date;
  rankingEndDate: Date;
}

export class PersistRankingService {
  private calculateService = new CalculateRankingService();

  async execute(input: PersistRankingInput): Promise<void> {
    const { rankingId, rankingStartDate, rankingEndDate } = input;

    const results = await this.calculateService.execute({
      rankingStartDate,
      rankingEndDate
    });

    // Ordenação determinística (critério já definido)
    const ordered = results.sort((a, b) => {
      if (b.rankingScore !== a.rankingScore) {
        return b.rankingScore - a.rankingScore;
      }

      if (b.lastScoreRound !== a.lastScoreRound) {
        return b.lastScoreRound - a.lastScoreRound;
      }

      return a.lastScoreDate.getTime() - b.lastScoreDate.getTime();
    });

    let position = 1;

    for (const item of ordered) {
      await prisma.rankingParticipant.upsert({
        where: {
          rankingId_userId: {
            rankingId,
            userId: item.userId
          }
        },
        update: {
          score: item.rankingScore,
          scoreInitial: item.scoreInitial,
          position
        },
        create: {
          rankingId,
          userId: item.userId,
          score: item.rankingScore,
          scoreInitial: item.scoreInitial,
          position
        }
      });

      position++;
    }
  }
}
