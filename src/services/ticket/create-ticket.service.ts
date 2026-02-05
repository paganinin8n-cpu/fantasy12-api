import { prisma } from '../../lib/prisma';
import { ConsumeBenefitsService } from '../benefits/consume-benefits.service';
import { BetType } from '@prisma/client';

type CreateTicketInput = {
  userId: string;
  roundId: string;
  prediction: string;
  betType?: BetType;
};

export class CreateTicketService {
  static async execute({
    userId,
    roundId,
    prediction,
    betType = BetType.NONE,
  }: CreateTicketInput) {
    return prisma.$transaction(async tx => {
      /**
       * 1️⃣ Validar rodada
       */
      const round = await tx.round.findUnique({
        where: { id: roundId },
        select: { status: true },
      });

      if (!round || round.status !== 'OPEN') {
        throw new Error('Round is not open');
      }

      /**
       * 2️⃣ Garantir imutabilidade
       */
      const existing = await tx.ticket.findUnique({
        where: {
          userId_roundId: { userId, roundId },
        },
      });

      if (existing) {
        throw new Error('Ticket already created for this round');
      }

      /**
       * 3️⃣ Consumir benefício (SE houver)
       */
      if (betType !== BetType.NONE) {
        await ConsumeBenefitsService.execute({
          userId,
          roundId,
          type: betType,
        });
      }

      /**
       * 4️⃣ Definir multiplicador
       */
      const betMultiplier =
        betType === BetType.DOUBLE ? 2 :
        betType === BetType.SUPER_DOUBLE ? 4 :
        1;

      /**
       * 5️⃣ Criar ticket (imutável)
       */
      const ticket = await tx.ticket.create({
        data: {
          userId,
          roundId,
          prediction,
          betType,
          betMultiplier,
        },
      });

      return {
        id: ticket.id,
        roundId: ticket.roundId,
        betType: ticket.betType,
        betMultiplier: ticket.betMultiplier,
        createdAt: ticket.createdAt,
      };
    });
  }
}
