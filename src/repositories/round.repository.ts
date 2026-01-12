import { prisma } from '../lib/prisma';
import { RoundStatus } from '@prisma/client';

export class RoundRepository {

  async getLastRoundNumber(): Promise<number> {
    const last = await prisma.round.findFirst({
      orderBy: { number: 'desc' },
      select: { number: true }
    });

    return last?.number ?? 0;
  }

  async findOpenRound() {
    return prisma.round.findFirst({
      where: { status: RoundStatus.OPEN }
    });
  }

  async create(data: {
    number: number;
    openAt: Date;
    closeAt: Date;
  }) {
    return prisma.round.create({
      data: {
        number: data.number,
        openAt: data.openAt,
        closeAt: data.closeAt,
        status: RoundStatus.OPEN
      }
    });
  }

  async updateStatus(roundId: string, status: RoundStatus) {
    return prisma.round.update({
      where: { id: roundId },
      data: { status }
    });
  }

  async findById(roundId: string) {
    return prisma.round.findUnique({
      where: { id: roundId }
    });
  }
}
