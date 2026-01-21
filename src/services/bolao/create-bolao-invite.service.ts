import { prisma } from '../../lib/prisma';
import { randomUUID } from 'crypto';

type CreateInviteInput = {
  rankingId: string;
  createdByUserId: string;
  maxUses?: number;
  expiresAt?: Date;
};

export class CreateBolaoInviteService {
  static async execute({
    rankingId,
    createdByUserId,
    maxUses,
    expiresAt,
  }: CreateInviteInput) {
    // validar ranking (bolão)
    const ranking = await prisma.ranking.findUnique({
      where: { id: rankingId },
      select: { id: true, type: true, createdByUserId: true },
    });

    if (!ranking) throw new Error('Bolão not found');
    if (ranking.type !== 'BOLAO') throw new Error('Ranking is not a bolão');

    // apenas o criador pode gerar convite (regra inicial)
    if (ranking.createdByUserId !== createdByUserId) {
      throw new Error('Only bolão creator can generate invites');
    }

    const code = randomUUID();

    const invite = await prisma.bolaoInvite.create({
      data: {
        rankingId,
        code,
        maxUses,
        expiresAt,
        createdByUserId,
      },
    });

    return {
      id: invite.id,
      code: invite.code,
      maxUses: invite.maxUses,
      expiresAt: invite.expiresAt,
      isActive: invite.isActive,
      createdAt: invite.createdAt,
    };
  }
}
