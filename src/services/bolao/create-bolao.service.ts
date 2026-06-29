import { prisma } from '../../lib/prisma';
import { randomUUID } from 'crypto';
import { hasActiveProSubscription } from '../../domain/subscription';
import { AppError } from '../../errors/AppError';
import { RankingWindowScoreService } from '../ranking/ranking-window-score.service';

type CreateBolaoInput = {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  entryFee?: number;
  maxParticipants?: number; // default 50
  createdByUserId: string;
};

export class CreateBolaoService {
  static async execute(input: CreateBolaoInput) {
    const {
      name,
      description,
      startDate,
      endDate,
      entryFee = 0,
      maxParticipants = 50,
      createdByUserId,
    } = input;

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

    if (entryFee < 0) {
      throw new Error('A entrada em fichas não pode ser negativa');
    }

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
          status: 'DRAFT',
          entryFee,
          maxParticipants,
          currentParticipants: 0,
          durationDays,
          startDate,
          endDate,
          createdByUserId,
        },
      });

      const creatorScoreInitial =
        (await RankingWindowScoreService.getScoreTotalBefore(tx, createdByUserId, new Date())) ?? 0;

      await tx.rankingParticipant.create({
        data: {
          rankingId: bolao.id,
          userId: createdByUserId,
          score: 0,
          scoreInitial: creatorScoreInitial,
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedByUserId: createdByUserId,
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
            description: description ?? null,
            entryFee,
            maxParticipants,
            durationDays,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            creatorScoreInitial,
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
    };
  }
}
