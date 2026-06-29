import { prisma } from '../../lib/prisma';
import { RankingWindowScoreService } from '../ranking/ranking-window-score.service';

type ExecuteInput = {
  rankingId: string;
  viewerUserId?: string;
};

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

    const isOwner = bolao.createdByUserId === viewerUserId;
    const viewerParticipant = viewerUserId
      ? bolao.participants.find(p => p.userId === viewerUserId)
      : undefined;
    const approvedParticipants = bolao.participants.filter(
      participant => participant.status === 'APPROVED'
    );
    const pendingParticipants = isOwner
      ? bolao.participants.filter(participant => participant.status === 'PENDING')
      : [];

    const liveRows = await RankingWindowScoreService.buildRows(prisma, {
      id: bolao.id,
      startDate: bolao.startDate,
      endDate: bolao.endDate,
    });

    const liveByUserId = new Map(liveRows.map(row => [row.userId, row]));
    const userInfoById = new Map(
      approvedParticipants.map(p => [
        p.userId,
        { name: p.user.nickname?.trim() || p.user.name?.trim() || 'Jogador', participantStatus: p.status, approvedAt: p.approvedAt },
      ])
    );

    const entries = liveRows
      .map((row, index) => {
        const info = userInfoById.get(row.userId);
        return {
          userId: row.userId,
          name: info?.name ?? 'Jogador',
          score: row.score,
          scoreInitial: row.scoreInitial,
          scoreTotal: row.score,
          scoreRound: row.scoreRound,
          position: index + 1,
          participantStatus: info?.participantStatus ?? 'APPROVED',
          approvedAt: info?.approvedAt ?? null,
        };
      })
      .sort((a, b) => b.score - a.score || a.position - b.position)
      .map((entry, index) => ({ ...entry, position: index + 1 }));

    return {
      ranking: {
      id: bolao.id,
      name: bolao.name,
      description: bolao.description,
      status: bolao.status,
      entryFee: bolao.entryFee,
      startDate: bolao.startDate,
      endDate: bolao.endDate,
      maxParticipants: bolao.maxParticipants,
      participants: bolao.currentParticipants,
      isOwner,
      joined: viewerParticipant?.status === 'APPROVED',
      participantId: viewerParticipant?.id ?? null,
      participantStatus: viewerParticipant?.status ?? null,
      ownerName:
        bolao.createdBy?.nickname?.trim() ||
        bolao.createdBy?.name?.trim() ||
        'Fantasy12',
      },
      total: entries.length,
      me: entries.find(entry => entry.userId === viewerUserId) ?? null,
      entries,
      pendingRequests: pendingParticipants.map(participant => ({
        participantId: participant.id,
        userId: participant.userId,
        name:
          participant.user.nickname?.trim() ||
          participant.user.name?.trim() ||
          'Jogador',
        requestedAt: participant.createdAt,
      })),
    };
  }
}
