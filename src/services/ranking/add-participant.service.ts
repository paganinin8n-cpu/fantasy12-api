import { prisma } from '../../lib/prisma';

interface AddParticipantInput {
  rankingId: string;
  userId: string;
}

export class AddParticipantService {
  async execute(input: AddParticipantInput) {
    const ranking = await prisma.ranking.findUnique({
      where: { id: input.rankingId }
    });

    if (!ranking) {
      throw new Error('Ranking não encontrado');
    }

    const now = new Date();

    if (now >= ranking.startDate) {
      throw new Error('Ranking já iniciado. Não é possível adicionar participantes.');
    }

    const exists = await prisma.rankingParticipant.findUnique({
      where: {
        rankingId_userId: {
          rankingId: input.rankingId,
          userId: input.userId
        }
      }
    });

    if (exists) {
      throw new Error('Usuário já participa do ranking');
    }

    const lastScore = await prisma.userScoreHistory.findFirst({
      where: {
        userId: input.userId,
        createdAt: {
          lt: ranking.startDate
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const scoreInitial = lastScore?.scoreTotal ?? 0;

    return prisma.rankingParticipant.create({
      data: {
        rankingId: input.rankingId,
        userId: input.userId,
        scoreInitial,
        score: 0
      }
    });
  }
}
