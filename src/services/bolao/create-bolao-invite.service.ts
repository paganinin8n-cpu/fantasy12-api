import { prisma } from '../../lib/prisma';
import { randomUUID } from 'crypto';
import { AssertActiveProUserService } from '../subscription/assert-active-pro-user.service';

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
    await AssertActiveProUserService.execute(createdByUserId);

    // validar ranking (Mesa privada)
    const ranking = await prisma.ranking.findUnique({
      where: { id: rankingId },
      select: { id: true, type: true, createdByUserId: true },
    });

    if (!ranking) throw new Error('Mesa não encontrada');
    if (ranking.type !== 'BOLAO') throw new Error('Ranking não é uma Mesa');

    // apenas o criador pode gerar convite (regra inicial)
    if (ranking.createdByUserId !== createdByUserId) {
      throw new Error('Apenas o dono da Mesa pode gerar convites');
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

    await prisma.auditLog.create({
      data: {
        userId: createdByUserId,
        action: 'BOLAO_INVITE_CREATED',
        entity: 'BOLAO_INVITE',
        entityId: invite.id,
        metadata: {
          rankingId,
          maxUses: invite.maxUses,
          expiresAt: invite.expiresAt?.toISOString() ?? null,
        },
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
