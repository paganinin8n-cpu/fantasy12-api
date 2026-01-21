import { prisma } from '../../lib/prisma';

export class AssertCanAddParticipantService {
  async execute(rankingId: string) {
    const ranking = await prisma.ranking.findUnique({
      where: { id: rankingId },
      select: {
        id: true,
        status: true,
        type: true,
      },
    });

    if (!ranking) {
      throw new Error('Ranking não encontrado');
    }

    if (ranking.status !== 'ACTIVE') {
      throw new Error('Ranking inativo ou expirado');
    }

    // Enum congelado: GLOBAL | PRO | BOLAO
    return true;
  }
}
