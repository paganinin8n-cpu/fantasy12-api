import { prisma } from '../../lib/prisma';
import { RankingWindowScoreService } from '../ranking/ranking-window-score.service';
import { BolaoRegistrationWindowService } from './bolao-registration-window.service';
import { BolaoEntryPaymentService } from './bolao-entry-payment.service';
import { BolaoPrizeService } from './bolao-prize.service';
import { MesaCategoryRules } from './mesa-category-rules';

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
          accessCost: true,
          category: true,
          sponsorPrizePool: true,
          currentParticipants: true,
          maxParticipants: true,
          createdByUserId: true,
          startDate: true,
          entryEndDate: true,
          endDate: true,
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

      const accessCost = bolao.accessCost ?? bolao.entryFee;
      const isPaid = MesaCategoryRules.isPaid(bolao);

      if (status === 'APPROVED') {
        BolaoRegistrationWindowService.assertOpen(bolao);
      }

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
        throw new Error('O acesso desta participação já foi debitado');
      }

      if (isPaid) {
        await BolaoEntryPaymentService.debit(tx, {
          rankingId,
          userId: participant.userId,
          amount: accessCost,
        });
      }

      const seatReservedByCapacity = MesaCategoryRules.hasCapacity(bolao);
      if (seatReservedByCapacity) {
        const reservation = await tx.ranking.updateMany({
          where: {
            id: rankingId,
            currentParticipants: { lt: bolao.maxParticipants! },
          },
          data: { currentParticipants: { increment: 1 } },
        });
        if (reservation.count !== 1) {
          throw new Error('Esta Mesa atingiu o limite de participantes');
        }
      }

      const approvedAt = new Date();
      const scoreInitial =
        await RankingWindowScoreService.getScoreTotalBefore(
          tx,
          participant.userId,
          BolaoRegistrationWindowService.baselineAt(bolao)
        );

      const approved = await tx.rankingParticipant.update({
        where: { id: participantId },
        data: {
          status: 'APPROVED',
          scoreInitial,
          approvedAt,
          approvedByUserId: reviewerUserId,
          rejectedAt: null,
          entryFeePaid: isPaid ? accessCost : 0,
          entryPaidAt: isPaid ? approvedAt : null,
        },
      });

      if (!seatReservedByCapacity || isPaid) {
        const financialRanking = await tx.ranking.update({
          where: { id: rankingId },
          data: {
            ...(!seatReservedByCapacity
              ? { currentParticipants: { increment: 1 } }
              : {}),
            ...(isPaid ? { grossCollected: { increment: accessCost } } : {}),
          },
          select: { grossCollected: true },
        });
        if (isPaid) {
          const financialTotals = BolaoPrizeService.calculatePool(
            financialRanking.grossCollected
          );
          await tx.ranking.update({
            where: { id: rankingId },
            data: {
              platformFee: financialTotals.platformFee,
              prizePool: financialTotals.prizePool,
              rewardPool: financialTotals.prizePool,
            },
          });
        }
      }

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
            accessCost,
            category: MesaCategoryRules.category(bolao),
            minimumChips: accessCost,
          },
        },
      });

      return approved;
    });
  }
}
