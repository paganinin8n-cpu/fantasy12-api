import { prisma } from '../../lib/prisma';

export class AssertCanAddParticipantService {
  async execute(rankingId: string) {
    const ranking = await prisma.ranking.findUnique({
      where: { id: rankingId },
      select: { id: true, isActive: true, type: true }
    });

    if (!ranking) {
      throw new Error('Ranking não encontrado');
    }

    if (!ranking.isActive) {
      throw new Error('Ranking inativo ou expirado');
    }

    // Enum congelado: GLOBAL | PRO | BOLAO
    // Regra explícita para BOLAO já coberta por isActive=false
    return true;
  }
}
