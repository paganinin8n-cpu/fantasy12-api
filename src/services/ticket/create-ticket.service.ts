import { prisma } from '../../lib/prisma';
import { ConsumeBenefitsService } from '../benefits/consume-benefits.service';

type CreateTicketInput = {
  userId: string;
  roundId: string;
  prediction: string;
  betType?: 'NONE' | 'DOUBLE' | 'SUPER_DOUBLE';
};

export class CreateTicketService {
  static async execute({
    userId,
    roundId,
    prediction,
    betType = 'NONE',
  }: CreateTicketInput) {
    return prisma.$transaction(async tx => {
      /**
       * 1️⃣ Validar rodada
       */
      const round = await tx.round.findUnique({
        where: { id: roundId },
        select: { id: true, status: true },
      });

      if (!round || round.status !== 'OPEN') {
        throw new Error('Round is not open');
      }

      /**
       * 2️⃣ Verificar ticket existente (IMUTÁVEL)
       */
      const existing = await tx.ticket.findUnique({
        where: {
          userId_roundId: {
            userId,
            roundId,
          },
        },
      });

      if (existing) {
        throw new Error('Ticket already created for this round');
      }

      /**
       * 3️⃣ Consumir benefício (se houver)
       */
      if (betType !== 'NONE') {
        await ConsumeBenefitsService.execute({
          userId,
          roundId,
          type: betType,
        });
      }

      /**
       * 4️⃣ Criar ticket (imutável)
       */
      const ticket = await tx.ticket.create({
        data: {
          userId,
          roundId,
          prediction,
          betType,
        },
      });

      return {
        id: ticket.id,
        roundId: ticket.roundId,
        betType: ticket.betType,
        createdAt: ticket.createdAt,
      };
    });
  }
}
