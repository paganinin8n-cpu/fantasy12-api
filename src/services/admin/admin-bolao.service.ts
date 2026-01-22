import { prisma } from '../../lib/prisma';
import { randomUUID } from 'crypto';

export class AdminBolaoService {
  async createBolao(input: {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    durationDays: number;
    createdByUserId: string;
  }) {
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
        id: randomUUID(), // ✅ EXPLÍCITO
        name,
        description,
        type: 'BOLAO',
        status: 'ACTIVE',
        startDate,
        endDate,
        maxParticipants: null,
        currentParticipants: 1,
        durationDays,
        createdByUserId,
      },
    });
  }
}
