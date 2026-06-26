import { prisma } from '../../lib/prisma';

export class ListAvailableBoloesService {
  static async execute({ userId }: { userId: string }) {
    const boloes = await prisma.ranking.findMany({
      where: {
        type: 'BOLAO',
        status: 'DRAFT',
      },
      orderBy: [
        { startDate: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        createdBy: {
          select: {
            name: true,
            nickname: true,
          },
        },
        participants: {
          where: { userId },
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    return boloes.map(bolao => {
      const participant = bolao.participants[0] ?? null;

      return {
        id: bolao.id,
        name: bolao.name,
        description: bolao.description,
        status: bolao.status,
        entryFee: bolao.entryFee,
        startDate: bolao.startDate,
        endDate: bolao.endDate,
        maxParticipants: bolao.maxParticipants,
        participants: bolao.currentParticipants,
        currentParticipants: bolao.currentParticipants,
        isOwner: bolao.createdByUserId === userId,
        joined: participant?.status === 'APPROVED',
        participantId: participant?.id ?? null,
        participantStatus: participant?.status ?? null,
        ownerName:
          bolao.createdBy?.nickname?.trim() ||
          bolao.createdBy?.name?.trim() ||
          'Fantasy12',
      };
    });
  }
}
