import { prisma } from '../../lib/prisma';
import { ConsumeBenefitsService } from '../benefits/consume-benefits.service';

type CreateTicketInput = {
  userId: string;
  roundId: string;
  prediction: string;
  useBenefit?: 'NONE' | 'DOUBLE' | 'SUPER_DOUBLE';
};

export class CreateTicketService {
  static async execute({
    userId,
    roundId,
    prediction,
    useBenefit = 'NONE',
  }: CreateTicketInput) {
    /**
     * 1️⃣ Validar rodada
     */
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      select: { id: true, status: true },
    });

    if (!round || round.status !== 'OPEN') {
      throw new Error('Round is not open');
    }

    /**
     * 2️⃣ Consumir benefício (se solicitado)
     */
    if (useBenefit !== 'NONE') {
      await ConsumeBenefitsService.execute({
        userId,
        roundId,
        type: useBenefit,
      });
    }

    /**
     * 3️⃣ Criar ou atualizar bilhete
     */
    const ticket = await prisma.ticket.upsert({
      where: {
        userId_roundId: {
          userId,
          roundId,
        },
      },
      update: {
        prediction,
      },
      create: {
        userId,
        roundId,
        prediction,
      },
    });

    return {
      id: ticket.id,
      roundId: ticket.roundId,
      useBenefit,
      createdAt: ticket.createdAt,
    };
  }
}
