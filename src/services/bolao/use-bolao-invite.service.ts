import { prisma } from '../../lib/prisma';
import { JoinBolaoService } from './join-bolao.service';

type UseInviteInput = {
  code: string;
  userId: string;
};

export class UseBolaoInviteService {
  static async execute({ code, userId }: UseInviteInput) {
    return prisma.$transaction(async tx => {
      const invite = await tx.bolaoInvite.findUnique({
        where: { code },
        select: {
          id: true,
          rankingId: true,
          maxUses: true,
          usedCount: true,
          expiresAt: true,
          isActive: true,
        },
      });

      if (!invite) throw new Error('Invite not found');
      if (!invite.isActive) throw new Error('Invite is not active');
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        throw new Error('Invite has expired');
      }
      if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) {
        throw new Error('Invite usage limit reached');
      }

      // delega entrada ao fluxo oficial
      const joinResult = await JoinBolaoService.execute({
        rankingId: invite.rankingId,
        userId,
      });

      // incrementa uso do convite
      await tx.bolaoInvite.update({
        where: { id: invite.id },
        data: {
          usedCount: invite.usedCount + 1,
        },
      });

      return {
        ...joinResult,
        inviteCode: code,
      };
    });
  }
}
