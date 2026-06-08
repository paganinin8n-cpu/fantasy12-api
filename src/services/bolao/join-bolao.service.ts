import { prisma } from '../../lib/prisma';
import { AssertActiveProUserService } from '../subscription/assert-active-pro-user.service';
import { RankingWindowScoreService } from '../ranking/ranking-window-score.service';

type JoinBolaoInput = {
  rankingId: string;
  userId: string;
};

export class JoinBolaoService {
  static async execute({ rankingId, userId }: JoinBolaoInput) {
    await AssertActiveProUserService.execute(userId);

    return prisma.$transaction(async tx => {
      /**
       * 1️⃣ Buscar Mesa com lock lógico
       */
      const bolao = await tx.ranking.findUnique({
        where: { id: rankingId },
        select: {
          id: true,
          type: true,
          status: true,
          maxParticipants: true,
          currentParticipants: true,
          durationDays: true,
        },
      });

      if (!bolao) {
        throw new Error('Mesa não encontrada');
      }

      if (bolao.type !== 'BOLAO') {
        throw new Error('Ranking não é uma Mesa');
      }

      if (bolao.status !== 'DRAFT') {
        throw new Error('Esta Mesa não está aberta para novos participantes');
      }

      if (
        bolao.maxParticipants !== null &&
        bolao.currentParticipants >= bolao.maxParticipants
      ) {
        throw new Error('Esta Mesa já está cheia');
      }

      /**
       * 2️⃣ Verificar se usuário já é participante
       */
      const alreadyParticipant = await tx.rankingParticipant.findUnique({
        where: {
          rankingId_userId: {
            rankingId,
            userId,
          },
        },
      });

      if (alreadyParticipant) {
        throw new Error('Você já participa desta Mesa');
      }

      /**
       * 3️⃣ Inserir participante
       */
      await tx.rankingParticipant.create({
        data: {
          rankingId,
          userId,
          score: 0,
          scoreInitial: 0,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'BOLAO_JOINED',
          entity: 'RANKING',
          entityId: rankingId,
          metadata: {
            statusBefore: bolao.status,
            scoreInitial: 0,
            currentParticipantsBefore: bolao.currentParticipants,
            maxParticipants: bolao.maxParticipants,
          },
        },
      });

      /**
       * 4️⃣ Incrementar contador
       */
      const updatedParticipants = bolao.currentParticipants + 1;

      /**
       * 5️⃣ Ativação automática se atingir o limite
       */
      if (
        bolao.maxParticipants !== null &&
        updatedParticipants === bolao.maxParticipants
      ) {
        const startDate = new Date();
        const endDate = new Date(
          startDate.getTime() + (bolao.durationDays ?? 0) * 24 * 60 * 60 * 1000
        );

        const participants = await tx.rankingParticipant.findMany({
          where: { rankingId },
          select: { id: true, userId: true },
        });

        for (const participant of participants) {
          const scoreInitial =
            await RankingWindowScoreService.getScoreTotalBefore(
              tx,
              participant.userId,
              startDate
            );

          await tx.rankingParticipant.update({
            where: { id: participant.id },
            data: { scoreInitial },
          });

          await tx.auditLog.create({
            data: {
              userId: participant.userId,
              action: 'BOLAO_PARTICIPANT_BASELINE_CAPTURED',
              entity: 'RANKING_PARTICIPANT',
              entityId: participant.id,
              metadata: {
                rankingId,
                startDate: startDate.toISOString(),
                scoreInitial,
                formula: 'scoreTotalCurrent - scoreInitial',
              },
            },
          });
        }

        await tx.ranking.update({
          where: { id: rankingId },
          data: {
            currentParticipants: updatedParticipants,
            status: 'ACTIVE',
            startDate,
            endDate,
          },
        });

        await tx.auditLog.create({
          data: {
            userId,
            action: 'BOLAO_ACTIVATED',
            entity: 'RANKING',
            entityId: rankingId,
            metadata: {
              currentParticipants: updatedParticipants,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            },
          },
        });

        return {
          status: 'ACTIVATED',
          rankingId,
          currentParticipants: updatedParticipants,
          startDate,
          endDate,
        };
      }

      /**
       * 6️⃣ Apenas atualizar contador
       */
      await tx.ranking.update({
        where: { id: rankingId },
        data: {
          currentParticipants: updatedParticipants,
        },
      });

      return {
        status: 'JOINED',
        rankingId,
        currentParticipants: updatedParticipants,
      };
    });
  }
}
