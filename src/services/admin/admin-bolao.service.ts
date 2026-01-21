import { prisma } from '../../lib/prisma';

export class AdminBolaoService {
  static async create(adminUserId: string, data: {
    name: string;
    description?: string;
    durationDays: number;
  }) {
    const bolao = await prisma.ranking.create({
      data: {
        name: data.name,
        description: data.description,
        type: 'BOLAO',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(
          Date.now() + data.durationDays * 86400000
        ),
        maxParticipants: null,
        currentParticipants: 0,
        durationDays: data.durationDays,
        createdByUserId: adminUserId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'ADMIN_CREATE_BOLAO',
        entity: 'Ranking',
        entityId: bolao.id,
        metadata: data,
      },
    });

    return bolao;
  }
}
