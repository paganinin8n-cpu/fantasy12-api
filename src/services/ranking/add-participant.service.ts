import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';
import { RankingWindowScoreService } from './ranking-window-score.service';

interface AddParticipantInput {
  rankingId: string;
  userId: string;
}

export class AddParticipantService {
  async execute(input: AddParticipantInput) {
    return prisma.$transaction(async tx => {
      const ranking = await tx.ranking.findUnique({
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

      const exists = await tx.rankingParticipant.findUnique({
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
            tx,
            input.userId,
            ranking.startDate
          )
        : 0;

      const participant = await tx.rankingParticipant.create({
        data: {
          rankingId: input.rankingId,
          userId: input.userId,
          scoreInitial,
          score: 0,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: input.userId,
          action: 'RANKING_PARTICIPANT_ADDED',
          entity: 'RANKING_PARTICIPANT',
          entityId: participant.id,
          metadata: {
            rankingId: input.rankingId,
            scoreInitial,
            source: 'manual_add',
          },
        },
      });

      return participant;
    });
  }
}
