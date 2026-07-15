import { prisma } from '../../lib/prisma';
import { randomUUID } from 'crypto';

type CreateBolaoInput = {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  createdByUserId: string;
};

export class AdminBolaoService {
  /**
   * 🔹 MÉTODO ANTIGO (PRESERVADO)
   * Usado por controllers antigos
   */
  static async create(adminId: string, input: CreateBolaoInput) {
    // regra antiga: admin cria Mesa em nome de outro usuário
    return this.execute({
      ...input,
      createdByUserId: input.createdByUserId ?? adminId,
    });
  }

  /**
   * 🔹 MÉTODO ATUAL (LÓGICA REAL)
   */
  static async execute(input: CreateBolaoInput) {
    const {
      name,
      description,
      startDate,
      endDate,
      durationDays,
      createdByUserId,
    } = input;

    return prisma.$transaction(async tx => {
      const bolao = await tx.ranking.create({
        data: {
          id: randomUUID(), // incremento mínimo já aprovado
          name,
          description,
          type: 'BOLAO',
          status: 'ACTIVE',
          startDate,
          endDate,
          durationDays,
          currentParticipants: 0,
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
        select: { id: true },
      });

      if (!firstRound) {
        throw new Error('Não existe rodada válida dentro do período da Mesa');
      }

      await tx.rankingRound.create({
        data: {
          rankingId: bolao.id,
          roundId: firstRound.id,
        },
      });

      return bolao;
    });
  }
}
