import { prisma } from '../../lib/prisma';
import { RankingWindowScoreService } from '../ranking/ranking-window-score.service';

type ExecuteInput = {
  rankingId: string;
  viewerUserId?: string;
};

function displayName(user: { nickname?: string | null; name?: string | null } | null | undefined) {
  return user?.nickname?.trim() || user?.name?.trim() || 'Jogador';
}

export class GetBolaoRankingService {
  static async execute({ rankingId, viewerUserId }: ExecuteInput) {
    const bolao = await prisma.ranking.findUnique({
      where: { id: rankingId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            nickname: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                nickname: true,
              },
            },
          },
          orderBy: [
            { score: 'desc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    if (!bolao || bolao.type !== 'BOLAO') {
      throw new Error('Mesa não encontrada');
    }

    const ownerId = bolao.createdByUserId;
    const isOwner = ownerId === viewerUserId;
    const viewerParticipant = viewerUserId
      ? bolao.participants.find(p => p.userId === viewerUserId)
      : undefined;
    const approvedParticipants = bolao.participants.filter(
      participant => participant.status === 'APPROVED'
    );
    const pendingParticipants = isOwner
      ? bolao.participants.filter(participant => participant.status === 'PENDING')
      : [];

    const userInfoById = new Map(
      approvedParticipants.map(p => [
        p.userId,
        {
          name: displayName(p.user),
          participantStatus: p.status,
          approvedAt: p.approvedAt,
        },
      ])
    );

    // Mesa encerrada: usar scores congelados em RankingParticipant (igual ranking mensal).
    // Evita recomputar com histórico ausente e zerar a classificação.
    const entries =
      bolao.status === 'CLOSED'
        ? approvedParticipants.map(participant => ({
            userId: participant.userId,
            name: displayName(participant.user),
            isOwner: participant.userId === ownerId,
            isMe: participant.userId === viewerUserId,
            score: participant.score,
            scoreInitial: participant.scoreInitial,
            scoreTotal: participant.score,
            scoreRound: 0,
            position: participant.position ?? 0,
            participantStatus: participant.status,
            approvedAt: participant.approvedAt ?? null,
          }))
        : (
            await RankingWindowScoreService.buildRows(prisma, {
              id: bolao.id,
              startDate: bolao.startDate,
              endDate: bolao.endDate,
            })
          ).map(row => {
            const info = userInfoById.get(row.userId);
            return {
              userId: row.userId,
              name: info?.name ?? 'Jogador',
              isOwner: row.userId === ownerId,
              isMe: row.userId === viewerUserId,
              score: row.score,
              scoreInitial: row.scoreInitial,
              scoreTotal: row.score,
              scoreRound: row.scoreRound,
              position: row.position,
              participantStatus: info?.participantStatus ?? 'APPROVED',
              approvedAt: info?.approvedAt ?? null,
            };
          });

    return {
      ranking: {
        id: bolao.id,
        name: bolao.name,
        description: bolao.description,
        status: bolao.status,
        entryFee: bolao.entryFee,
        prizeDistribution: bolao.prizeDistribution,
        grossCollected: bolao.grossCollected,
        platformFee: bolao.platformFee,
        prizePool: bolao.prizePool,
        settledAt: bolao.settledAt,
        startDate: bolao.startDate,
        entryEndDate: bolao.entryEndDate,
        endDate: bolao.endDate,
        maxParticipants: bolao.maxParticipants,
        participants: bolao.currentParticipants,
        isOwner,
        joined: viewerParticipant?.status === 'APPROVED',
        participantId: viewerParticipant?.id ?? null,
        participantStatus: viewerParticipant?.status ?? null,
        ownerName: displayName(bolao.createdBy),
      },
      total: entries.length,
      me: entries.find(entry => entry.userId === viewerUserId) ?? null,
      entries,
      pendingRequests: pendingParticipants.map(participant => ({
        participantId: participant.id,
        userId: participant.userId,
        name: displayName(participant.user),
        requestedAt: participant.createdAt,
      })),
    };
  }
}
