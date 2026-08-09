import { prisma } from '../../lib/prisma';
import { JoinBolaoService } from './join-bolao.service';
import { reserveBolaoInviteUse } from './bolao-invite-reservation';

type UseInviteInput = {
  code: string;
  userId: string;
};

export class UseBolaoInviteService {
  static async execute({ code, userId }: UseInviteInput) {
    return prisma.$transaction(async tx => {
      const now = new Date();
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

      const existingParticipant = await tx.rankingParticipant.findUnique({
        where: {
          rankingId_userId: {
            rankingId: invite.rankingId,
            userId,
          },
        },
        select: { id: true, status: true, entryPaidAt: true },
      });

      if (existingParticipant?.status === 'APPROVED') {
        await tx.auditLog.create({
          data: {
            userId,
            action: 'BOLAO_INVITE_REUSED',
            entity: 'BOLAO_INVITE',
            entityId: invite.id,
            metadata: {
              rankingId: invite.rankingId,
              participantId: existingParticipant.id,
              inviteUseConsumed: false,
            },
          },
        });

        return {
          status: 'APPROVED' as const,
          rankingId: invite.rankingId,
          participantId: existingParticipant.id,
          inviteCode: code,
          idempotent: true,
        };
      }

      if (!invite.isActive) throw new Error('Invite is not active');
      if (invite.expiresAt && invite.expiresAt <= now) {
        throw new Error('Invite has expired');
      }
      if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) {
        throw new Error('Invite usage limit reached');
      }

      const reservation = await reserveBolaoInviteUse(tx, invite.id, now);
      if (!reservation) {
        throw new Error('Invite is no longer available');
      }

      // O acesso usa exatamente a mesma transação da reserva do convite.
      const joinResult = await JoinBolaoService.execute({
        rankingId: invite.rankingId,
        userId,
      }, tx);

      await tx.auditLog.create({
        data: {
          userId,
          action: 'BOLAO_INVITE_USED',
          entity: 'BOLAO_INVITE',
          entityId: invite.id,
          metadata: {
            rankingId: invite.rankingId,
            usedCountBefore: invite.usedCount,
            usedCountAfter: reservation.usedCount,
            joinStatus: joinResult.status,
            inviteUseConsumed: true,
          },
        },
      });

      return {
        ...joinResult,
        inviteCode: code,
        idempotent: false,
      };
    });
  }
}
