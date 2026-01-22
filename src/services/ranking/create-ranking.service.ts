import { prisma } from '../../lib/prisma';
import { RankingType, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';

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
          role: UserRole.PRO
        }
      });

      if (users.length !== input.participantIds.length) {
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
      const lastScore = await prisma.userScoreHistory.findFirst({
        where: {
          userId,
          createdAt: {
            lt: input.startDate
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const scoreInitial = lastScore?.scoreTotal ?? 0;

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
