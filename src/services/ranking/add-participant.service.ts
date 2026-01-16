import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';

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
      throw new AppError('Ranking não encontrado', 404);
    }

    const now = new Date();

    if (now >= ranking.startDate) {
      throw new AppError(
        'Ranking já iniciado. Não é possível adicionar participantes.',
        409
      );
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
      throw new AppError('Usuário já participa do ranking', 409);
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
