import { prisma } from '../../lib/prisma';
import { RankingWindowScoreService } from '../ranking/ranking-window-score.service';
import { BolaoRegistrationWindowService } from './bolao-registration-window.service';
import { BolaoEntryPaymentService } from './bolao-entry-payment.service';
import { BolaoPrizeService } from './bolao-prize.service';

type JoinBolaoInput = {
  rankingId: string;
  userId: string;
};

export class JoinBolaoService {
  static async execute({ rankingId, userId }: JoinBolaoInput) {
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

      if (bolao.status !== 'ACTIVE') {
        throw new Error('Esta Mesa não está aberta para novos participantes');
      }

      const firstRound = BolaoRegistrationWindowService.assertOpen(bolao);

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
        throw new Error('A entrada desta participação já foi debitada');
      }

      const scoreInitial = await RankingWindowScoreService.getScoreTotalBefore(
        tx,
        userId,
        firstRound.closeAt
      );

      await BolaoEntryPaymentService.debit(tx, {
        rankingId,
        userId,
        amount: bolao.entryFee,
      });

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
              entryFeePaid: bolao.entryFee,
              entryPaidAt: approvedAt,
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
            entryFee: bolao.entryFee,
            approvalRequired: false,
          },
        },
      });

      return {
        status: 'APPROVED',
        rankingId,
        participantId: participant.id,
      };
    });
  }
}
