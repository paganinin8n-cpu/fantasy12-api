import { prisma } from '../../lib/prisma';
import { AssertActiveProUserService } from '../subscription/assert-active-pro-user.service';
import { BolaoRegistrationWindowService } from './bolao-registration-window.service';

type JoinBolaoInput = {
  rankingId: string;
  userId: string;
};

export class JoinBolaoService {
  static async execute({ rankingId, userId }: JoinBolaoInput) {
    await AssertActiveProUserService.execute(userId);

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

      if (bolao.status === 'CLOSED') {
        throw new Error('Esta Mesa não está aberta para novos participantes');
      }

      BolaoRegistrationWindowService.assertOpen(bolao);

      if (bolao.createdByUserId === userId) {
        throw new Error('O criador já administra esta Mesa');
      }

      if (
        bolao.maxParticipants !== null &&
        bolao.currentParticipants >= bolao.maxParticipants
      ) {
        throw new Error('Esta Mesa já está cheia');
      }

      if (bolao.entryFee > 0) {
        const wallet = await tx.wallet.findUnique({
          where: { userId },
          select: { balance: true },
        });

        if (!wallet || wallet.balance < bolao.entryFee) {
          throw new Error('Você não possui fichas suficientes para solicitar entrada nesta Mesa');
        }
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

      if (existingParticipant?.status === 'PENDING') {
        return {
          status: 'PENDING',
          rankingId,
          participantId: existingParticipant.id,
        };
      }

      const participant = existingParticipant
        ? await tx.rankingParticipant.update({
            where: { id: existingParticipant.id },
            data: {
              status: 'PENDING',
              rejectedAt: null,
              approvedAt: null,
              approvedByUserId: null,
            },
          })
        : await tx.rankingParticipant.create({
            data: {
              rankingId,
              userId,
              score: 0,
              scoreInitial: 0,
              status: 'PENDING',
            },
          });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'BOLAO_JOIN_REQUESTED',
          entity: 'RANKING',
          entityId: rankingId,
          metadata: {
            minimumChips: bolao.entryFee,
            currentParticipants: bolao.currentParticipants,
            maxParticipants: bolao.maxParticipants,
          },
        },
      });

      return {
        status: 'PENDING',
        rankingId,
        participantId: participant.id,
      };
    });
  }
}
