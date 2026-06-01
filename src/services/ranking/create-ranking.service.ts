import { prisma } from '../../lib/prisma';
import { RankingType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { hasActiveProSubscription } from '../../domain/subscription';
import { RankingWindowScoreService } from './ranking-window-score.service';

interface CreateRankingInput {
  name: string;
  description?: string;
  type: RankingType;
  startDate: Date;
  endDate?: Date;
  participantIds: string[];
}

export class CreateRankingService {
  async execute(input: CreateRankingInput) {
    // 1️⃣ Validações básicas
    if (input.type === RankingType.BOLAO) {
      if (!input.endDate) {
        throw new Error('Ranking BOLAO exige data final');
      }

      if (input.participantIds.length === 0) {
        throw new Error('Ranking BOLAO exige participantes');
      }
    }

    // 2️⃣ Validação de usuários PRO
    if (input.type === RankingType.BOLAO || input.type === RankingType.PRO) {
      const users = await prisma.user.findMany({
        where: {
          id: { in: input.participantIds },
        },
        select: {
          id: true,
          subscription: {
            select: {
              status: true,
              endAt: true,
            },
          },
        },
      });

      const allArePro = users.length === input.participantIds.length &&
        users.every(user => hasActiveProSubscription(user.subscription))

      if (!allArePro) {
        throw new Error('Apenas usuários PRO podem participar deste ranking');
      }
    }

    // 3️⃣ Criação do ranking
    const ranking = await prisma.ranking.create({
      data: {
        id: randomUUID(), // ✅ INCREMENTO MÍNIMO
        name: input.name,
        description: input.description,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate
      }
    });

    // 4️⃣ Criação dos participantes com scoreInitial
    for (const userId of input.participantIds) {
      const scoreInitial =
        await RankingWindowScoreService.getScoreTotalBefore(
          prisma,
          userId,
          input.startDate
        );

      await prisma.rankingParticipant.create({
        data: {
          rankingId: ranking.id,
          userId,
          scoreInitial,
          score: 0
        }
      });
    }

    return ranking;
  }
}
