import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { RankingWindowScoreService } from '../ranking/ranking-window-score.service';
import { BolaoRegistrationWindowService } from './bolao-registration-window.service';
import { BolaoEntryPaymentService } from './bolao-entry-payment.service';
import { BolaoPrizeService } from './bolao-prize.service';
import { AssertActiveProUserService } from '../subscription/assert-active-pro-user.service';
import { MesaCategoryRules } from './mesa-category-rules';

type JoinBolaoInput = {
  rankingId: string;
  userId: string;
};

export class JoinBolaoService {
  static async execute(
    input: JoinBolaoInput,
    transaction?: Prisma.TransactionClient
  ) {
    await AssertActiveProUserService.execute(input.userId);

    if (transaction) {
      return this.executeInTransaction(transaction, input);
    }

    return prisma.$transaction(tx => this.executeInTransaction(tx, input));
  }

  private static async executeInTransaction(
    tx: Prisma.TransactionClient,
    { rankingId, userId }: JoinBolaoInput
  ) {
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
          maxParticipants: true,
          currentParticipants: true,
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

      if (bolao.status !== 'ACTIVE') {
        throw new Error('Esta Mesa não está aberta para novos participantes');
      }

      const accessCost = bolao.accessCost ?? bolao.entryFee;
      const isPaid = MesaCategoryRules.isPaid(bolao);

      BolaoRegistrationWindowService.assertOpen(bolao);

      if (bolao.createdByUserId === userId) {
        throw new Error('O criador já administra esta Mesa');
      }

      const existingParticipant = await tx.rankingParticipant.findUnique({
        where: {
          rankingId_userId: {
            rankingId,
            userId,
          },
        },
      });

      if (existingParticipant?.status === 'APPROVED') {
        throw new Error('Você já participa desta Mesa');
      }

      if (existingParticipant?.entryPaidAt) {
        throw new Error('O acesso desta participação já foi debitado');
      }

      const baselineAt = BolaoRegistrationWindowService.baselineAt(bolao);
      const scoreInitial = await RankingWindowScoreService.getScoreTotalBefore(
        tx,
        userId,
        baselineAt
      );

      if (isPaid) {
        await BolaoEntryPaymentService.debit(tx, {
          rankingId,
          userId,
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
          data: {
            currentParticipants: { increment: 1 },
            ...(isPaid ? { grossCollected: { increment: accessCost } } : {}),
          },
        });
        if (reservation.count !== 1) {
          throw new Error('Esta Mesa atingiu o limite de participantes');
        }
      }

      const approvedAt = new Date();
      const participant = existingParticipant
        ? await tx.rankingParticipant.update({
            where: { id: existingParticipant.id },
            data: {
              status: 'APPROVED',
              scoreInitial,
              rejectedAt: null,
              approvedAt,
              approvedByUserId: userId,
              entryFeePaid: isPaid ? accessCost : 0,
              entryPaidAt: isPaid ? approvedAt : null,
            },
          })
        : await tx.rankingParticipant.create({
            data: {
              rankingId,
              userId,
              score: 0,
              scoreInitial,
              status: 'APPROVED',
              approvedAt,
              approvedByUserId: userId,
              entryFeePaid: isPaid ? accessCost : 0,
              entryPaidAt: isPaid ? approvedAt : null,
            },
          });

      if (!seatReservedByCapacity || isPaid) {
        const financialRanking = seatReservedByCapacity
          ? await tx.ranking.findUniqueOrThrow({
              where: { id: rankingId },
              select: { grossCollected: true },
            })
          : await tx.ranking.update({
              where: { id: rankingId },
              data: {
                currentParticipants: { increment: 1 },
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

      await tx.auditLog.create({
        data: {
          userId,
          action: 'BOLAO_JOIN_APPROVED',
          entity: 'RANKING_PARTICIPANT',
          entityId: participant.id,
          metadata: {
            rankingId,
            participantUserId: userId,
            approvedAt: approvedAt.toISOString(),
            scoreInitial,
            currentParticipants: bolao.currentParticipants + 1,
            accessCost,
            entryFee: accessCost,
            category: MesaCategoryRules.category(bolao),
            approvalRequired: false,
          },
        },
      });

      return {
        status: 'APPROVED',
        rankingId,
        participantId: participant.id,
      };
  }
}
