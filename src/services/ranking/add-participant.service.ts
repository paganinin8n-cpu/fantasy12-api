import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';
import { RankingWindowScoreService } from './ranking-window-score.service';

interface AddParticipantInput {
  rankingId: string;
  userId: string;
}

export class AddParticipantService {
  async execute(input: AddParticipantInput) {
    const ranking = await prisma.ranking.findUnique({
      where: { id: input.rankingId },
    });

    if (!ranking) {
      throw AppError.notFound('Ranking', 'ranking_not_found');
    }

    const now = new Date();

    if (ranking.startDate && now >= ranking.startDate) {
      throw AppError.conflict(
        'Ranking já iniciado. Não é possível adicionar participantes.',
        'ranking_already_started'
      );
    }

    const exists = await prisma.rankingParticipant.findUnique({
      where: {
        rankingId_userId: {
          rankingId: input.rankingId,
          userId: input.userId,
        },
      },
    });

    if (exists) {
      throw AppError.conflict(
        'Usuário já participa do ranking',
        'already_participating'
      );
    }

    const scoreInitial = ranking.startDate
      ? await RankingWindowScoreService.getScoreTotalBefore(
          prisma,
          input.userId,
          ranking.startDate
        )
      : 0;

    return prisma.rankingParticipant.create({
      data: {
        rankingId: input.rankingId,
        userId: input.userId,
        scoreInitial,
        score: 0,
      },
    });
  }
}
