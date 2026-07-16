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
  entryEndDate: Date;
  endDate: Date;
  entryFee?: number;
  prizeDistribution: PrizeDistributionItem[];
  createdByUserId: string;
};

export class CreateBolaoService {
  static async execute(input: CreateBolaoInput) {
    const {
      name,
      description: rawDescription,
      startDate,
      entryEndDate,
      endDate,
      entryFee = 0,
      prizeDistribution,
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

    if (!(entryEndDate instanceof Date) || Number.isNaN(entryEndDate.getTime())) {
      throw new Error('Informe uma data válida para o término das entradas');
    }

    if (entryEndDate <= startDate) {
      throw new Error('A data de término das entradas deve ser posterior à data de início');
    }

    if (entryEndDate > endDate) {
      throw new Error('A data de término das entradas deve ser anterior ou igual à data de fim da Mesa');
    }

    if (!Number.isInteger(entryFee) || entryFee <= 0) {
      throw new Error('A entrada em fichas deve ser maior que zero');
    }

    const validatedPrizeDistribution =
      BolaoPrizeService.validateDistribution(prizeDistribution);

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
          maxParticipants: null,
          currentParticipants: 0,
          durationDays,
          prizeDistribution: validatedPrizeDistribution,
          ...BolaoPrizeService.calculatePool(entryFee),
          startDate,
          entryEndDate,
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

      BolaoRegistrationWindowService.assertNotClosed({
        startDate,
        entryEndDate,
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
            maxParticipants: null,
            durationDays,
            startDate: startDate.toISOString(),
            entryEndDate: entryEndDate.toISOString(),
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
      entryEndDate: result.entryEndDate,
      endDate: result.endDate,
      prizeDistribution: result.prizeDistribution,
      grossCollected: result.grossCollected,
      platformFee: result.platformFee,
      prizePool: result.prizePool,
      settledAt: result.settledAt,
    };
  }
}
