import { prisma } from '../lib/prisma';
import { RoundStatus } from '@prisma/client';
import type { RoundMatchInput } from '../services/round/round-match.types';
import { normalizeRoundMatches } from '../services/round/round-match.types';

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
    matches: RoundMatchInput[];
  }) {
    const matches = normalizeRoundMatches(data.matches);

    return prisma.$transaction(async tx => {
      const round = await tx.round.create({
        data: {
          number: data.number,
          openAt: data.openAt,
          closeAt: data.closeAt,
          status: RoundStatus.DRAFT
        }
      });

      await tx.roundMatch.createMany({
        data: matches.map(match => ({
          ...match,
          roundId: round.id
        }))
      });

      return tx.round.findUniqueOrThrow({
        where: { id: round.id },
        include: {
          matches: {
            orderBy: { position: 'asc' }
          }
        }
      });
    });
  }

  async listAdmin() {
    return prisma.round.findMany({
      orderBy: {
        number: 'desc'
      },
      select: {
        id: true,
        number: true,
        status: true,
        openAt: true,
        closeAt: true,
        result: true,
        createdAt: true,
        updatedAt: true,
        matches: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            position: true,
            homeTeam: true,
            awayTeam: true,
            groupLabel: true,
            matchTime: true,
            result: true
          }
        }
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
