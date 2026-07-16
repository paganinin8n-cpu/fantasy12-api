import { prisma } from '../../lib/prisma';
import { randomUUID } from 'crypto';
import { hasActiveProSubscription } from '../../domain/subscription';
import { AppError } from '../../errors/AppError';
import { RankingWindowScoreService } from '../ranking/ranking-window-score.service';
import { BolaoEntryPaymentService } from './bolao-entry-payment.service';
import {
  BolaoPrizeService,
  PrizeDistributionItem,
} from './bolao-prize.service';
import { normalizeMesaPrizeRules } from './mesa-prize-rules';
import { BolaoRegistrationWindowService } from './bolao-registration-window.service';

type CreateBolaoInput = {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  entryFee?: number;
  prizeDistribution: PrizeDistributionItem[];
  maxParticipants?: number; // default 50
  createdByUserId: string;
};

export class CreateBolaoService {
  static async execute(input: CreateBolaoInput) {
    const {
      name,
      description: rawDescription,
      startDate,
      endDate,
      entryFee = 0,
      prizeDistribution,
      maxParticipants = 50,
      createdByUserId,
    } = input;
    const description = normalizeMesaPrizeRules(rawDescription);

    const user = await prisma.user.findUnique({
      where: { id: createdByUserId },
      select: {
        id: true,
        subscription: {
          select: { status: true, plan: true, endAt: true },
        },
      },
    });

    if (!user) {
      throw AppError.notFound('Usuário', 'user_not_found');
    }

    if (!hasActiveProSubscription(user.subscription)) {
      throw AppError.forbidden(
        'Montar Mesa é exclusivo para usuários com assinatura PRO ativa.',
        'pro_subscription_required'
      );
    }

    if (!name || name.trim().length < 3) {
      throw new Error('O nome da Mesa deve ter pelo menos 3 caracteres');
    }

    if (endDate <= startDate) {
      throw new Error('A data de fim deve ser posterior à data de início');
    }

    if (!Number.isInteger(entryFee) || entryFee <= 0) {
      throw new Error('A entrada em fichas deve ser maior que zero');
    }

    const validatedPrizeDistribution =
      BolaoPrizeService.validateDistribution(prizeDistribution);

    if (maxParticipants !== 50) {
      throw new Error('maxParticipants must be 50');
    }

    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const result = await prisma.$transaction(async tx => {
      const bolao = await tx.ranking.create({
        data: {
          id: randomUUID(),
          name,
          description,
          type: 'BOLAO',
          status: 'ACTIVE',
          entryFee,
          maxParticipants,
          currentParticipants: 0,
          durationDays,
          prizeDistribution: validatedPrizeDistribution,
          ...BolaoPrizeService.calculatePool(entryFee),
          startDate,
          endDate,
          createdByUserId,
        },
      });

      const firstRound = await tx.round.findFirst({
        where: {
          closeAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: [{ closeAt: 'asc' }, { number: 'asc' }],
        select: { id: true, status: true, closeAt: true },
      });

      if (!firstRound?.closeAt) {
        throw new Error('Não existe rodada válida dentro do período da Mesa');
      }

      BolaoRegistrationWindowService.assertOpen({
        rounds: [{ round: firstRound }],
      });

      await tx.rankingRound.create({
        data: {
          rankingId: bolao.id,
          roundId: firstRound.id,
        },
      });

      const creatorScoreInitial =
        (await RankingWindowScoreService.getScoreTotalBefore(
          tx,
          createdByUserId,
          firstRound.closeAt
        )) ?? 0;

      await BolaoEntryPaymentService.debit(tx, {
        rankingId: bolao.id,
        userId: createdByUserId,
        amount: entryFee,
      });

      const entryPaidAt = new Date();

      await tx.rankingParticipant.create({
        data: {
          rankingId: bolao.id,
          userId: createdByUserId,
          score: 0,
          scoreInitial: creatorScoreInitial,
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedByUserId: createdByUserId,
          entryFeePaid: entryFee,
          entryPaidAt,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: createdByUserId,
          action: 'BOLAO_CREATED',
          entity: 'RANKING',
          entityId: bolao.id,
          metadata: {
            name,
            description,
            entryFee,
            maxParticipants,
            durationDays,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            firstRoundId: firstRound.id,
            creatorScoreInitial,
            prizeDistribution: validatedPrizeDistribution,
            entryPaidAt: entryPaidAt.toISOString(),
          },
        },
      });

      const updatedBolao = await tx.ranking.update({
        where: { id: bolao.id },
        data: { currentParticipants: 1 },
      });

      return updatedBolao;
    });

    return {
      id: result.id,
      name: result.name,
      status: result.status,
      entryFee: result.entryFee,
      maxParticipants: result.maxParticipants,
      currentParticipants: result.currentParticipants,
      startDate: result.startDate,
      endDate: result.endDate,
      prizeDistribution: result.prizeDistribution,
      grossCollected: result.grossCollected,
      platformFee: result.platformFee,
      prizePool: result.prizePool,
      settledAt: result.settledAt,
    };
  }
}
