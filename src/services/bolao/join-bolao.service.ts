import { prisma } from '../../lib/prisma';

type JoinBolaoInput = {
  rankingId: string;
  userId: string;
};

export class JoinBolaoService {
  static async execute({ rankingId, userId }: JoinBolaoInput) {
    return prisma.$transaction(async tx => {
      /**
       * 1️⃣ Buscar bolão com lock lógico
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
        throw new Error('Bolão not found');
      }

      if (bolao.type !== 'BOLAO') {
        throw new Error('Ranking is not a bolão');
      }

      if (bolao.status !== 'DRAFT') {
        throw new Error('Bolão is not open for new participants');
      }

      if (
        bolao.maxParticipants !== null &&
        bolao.currentParticipants >= bolao.maxParticipants
      ) {
        throw new Error('Bolão is already full');
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
        throw new Error('User already joined this bolão');
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

        await tx.ranking.update({
          where: { id: rankingId },
          data: {
            currentParticipants: updatedParticipants,
            status: 'ACTIVE',
            startDate,
            endDate,
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
