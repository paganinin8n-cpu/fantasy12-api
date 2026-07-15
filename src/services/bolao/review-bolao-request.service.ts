import { prisma } from '../../lib/prisma';
import { RankingWindowScoreService } from '../ranking/ranking-window-score.service';
import { BolaoRegistrationWindowService } from './bolao-registration-window.service';

type ReviewBolaoRequestInput = {
  rankingId: string;
  participantId: string;
  reviewerUserId: string;
  status: 'APPROVED' | 'REJECTED';
};

export class ReviewBolaoRequestService {
  static async execute({
    rankingId,
    participantId,
    reviewerUserId,
    status,
  }: ReviewBolaoRequestInput) {
    return prisma.$transaction(async tx => {
      const bolao = await tx.ranking.findUnique({
        where: { id: rankingId },
        select: {
          id: true,
          type: true,
          status: true,
          entryFee: true,
          maxParticipants: true,
          currentParticipants: true,
          createdByUserId: true,
          rounds: {
            orderBy: { round: { number: 'asc' } },
            take: 1,
            select: {
              round: { select: { closeAt: true, status: true } },
            },
          },
        },
      });

      if (!bolao) {
        throw new Error('Mesa não encontrada');
      }

      if (bolao.type !== 'BOLAO') {
        throw new Error('Ranking não é uma Mesa');
      }

      if (bolao.createdByUserId !== reviewerUserId) {
        throw new Error('Apenas o criador pode revisar solicitações desta Mesa');
      }

      if (bolao.status === 'CLOSED') {
        throw new Error('Esta Mesa não está aberta para revisão de participantes');
      }

      const firstRound = status === 'APPROVED'
        ? BolaoRegistrationWindowService.assertOpen(bolao)
        : null;

      const participant = await tx.rankingParticipant.findUnique({
        where: { id: participantId },
        select: {
          id: true,
          rankingId: true,
          userId: true,
          status: true,
        },
      });

      if (!participant || participant.rankingId !== rankingId) {
        throw new Error('Solicitação não encontrada');
      }

      if (participant.status !== 'PENDING') {
        throw new Error('Esta solicitação já foi revisada');
      }

      if (status === 'REJECTED') {
        const rejected = await tx.rankingParticipant.update({
          where: { id: participantId },
          data: {
            status: 'REJECTED',
            rejectedAt: new Date(),
            approvedAt: null,
            approvedByUserId: null,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: reviewerUserId,
            action: 'BOLAO_JOIN_REJECTED',
            entity: 'RANKING_PARTICIPANT',
            entityId: participantId,
            metadata: {
              rankingId,
              participantUserId: participant.userId,
            },
          },
        });

        return rejected;
      }

      if (
        bolao.maxParticipants !== null &&
        bolao.currentParticipants >= bolao.maxParticipants
      ) {
        throw new Error('Esta Mesa já está cheia');
      }

      if (bolao.entryFee > 0) {
        const wallet = await tx.wallet.findUnique({
          where: { userId: participant.userId },
          select: { balance: true },
        });

        if (!wallet || wallet.balance < bolao.entryFee) {
          throw new Error('Participante não possui fichas suficientes para entrar nesta Mesa');
        }
      }

      const approvedAt = new Date();
      const scoreInitial =
        await RankingWindowScoreService.getScoreTotalBefore(
          tx,
          participant.userId,
          firstRound!.closeAt
        );

      const approved = await tx.rankingParticipant.update({
        where: { id: participantId },
        data: {
          status: 'APPROVED',
          scoreInitial,
          approvedAt,
          approvedByUserId: reviewerUserId,
          rejectedAt: null,
        },
      });

      const currentParticipants = bolao.currentParticipants + 1;

      await tx.ranking.update({
        where: { id: rankingId },
        data: { currentParticipants },
      });

      await tx.auditLog.create({
        data: {
          userId: reviewerUserId,
          action: 'BOLAO_JOIN_APPROVED',
          entity: 'RANKING_PARTICIPANT',
          entityId: participantId,
          metadata: {
            rankingId,
            participantUserId: participant.userId,
            approvedAt: approvedAt.toISOString(),
            scoreInitial,
            currentParticipants,
            minimumChips: bolao.entryFee,
          },
        },
      });

      return approved;
    });
  }
}
