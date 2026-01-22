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
    // regra antiga: admin cria bolão em nome de outro usuário
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

    return prisma.ranking.create({
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
  }
}
