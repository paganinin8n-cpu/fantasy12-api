import { prisma } from '../../lib/prisma';
import { RankingWindowScoreService } from '../ranking/ranking-window-score.service';
import { BolaoRegistrationWindowService } from './bolao-registration-window.service';
import { BolaoEntryPaymentService } from './bolao-entry-payment.service';
import { BolaoPrizeService } from './bolao-prize.service';

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
          currentParticipants: true,
          createdByUserId: true,
          startDate: true,
          entryEndDate: true,
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

      if (bolao.status !== 'ACTIVE') {
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
          entryPaidAt: true,
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

      if (participant.entryPaidAt) {
        throw new Error('A entrada desta participação já foi debitada');
      }

      await BolaoEntryPaymentService.debit(tx, {
        rankingId,
        userId: participant.userId,
        amount: bolao.entryFee,
      });

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
          entryFeePaid: bolao.entryFee,
          entryPaidAt: approvedAt,
        },
      });

      const financialRanking = await tx.ranking.update({
        where: { id: rankingId },
        data: {
          currentParticipants: { increment: 1 },
          grossCollected: { increment: bolao.entryFee },
        },
        select: { grossCollected: true },
      });
      const financialTotals = BolaoPrizeService.calculatePool(
        financialRanking.grossCollected
      );
      await tx.ranking.update({
        where: { id: rankingId },
        data: {
          platformFee: financialTotals.platformFee,
          prizePool: financialTotals.prizePool,
        },
      });

      const currentParticipants = bolao.currentParticipants + 1;

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
