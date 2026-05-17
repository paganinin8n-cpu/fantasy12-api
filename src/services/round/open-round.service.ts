import { prisma } from '../../lib/prisma';
import { RoundStatus } from '@prisma/client';
import { GrantRoundBenefitsService } from '../benefits/grant-round-benefits.service';

/**
 * Abre oficialmente uma rodada.
 *
 * RESPONSABILIDADES:
 * - Validar estado da rodada
 * - Mudar status para OPEN
 * - Delegar concessão de benefícios FREE
 *
 * REGRAS:
 * - Idempotente
 * - Executado somente via job interno
 */
export class OpenRoundService {
  static async execute(roundId: string): Promise<void> {
    await prisma.$transaction(async tx => {
      const round = await tx.round.findUnique({
        where: { id: roundId },
        select: { id: true, status: true },
      });

      if (!round) {
        throw new Error('Round not found');
      }

      if (round.status === RoundStatus.OPEN) {
        // Idempotência absoluta
        return;
      }

      if (round.status !== RoundStatus.DRAFT) {
        throw new Error('Only DRAFT rounds can be opened');
      }

      const alreadyOpenRound = await tx.round.findFirst({
        where: {
          status: RoundStatus.OPEN,
          id: {
            not: roundId,
          },
        },
        select: {
          number: true,
        },
      });

      if (alreadyOpenRound) {
        throw new Error(
          `A rodada ${alreadyOpenRound.number} ainda está aberta. Feche a rodada atual antes de abrir uma nova.`
        );
      }

      await tx.round.update({
        where: { id: roundId },
        data: {
          status: RoundStatus.OPEN,
          openAt: new Date(),
        },
      });
    });

    /**
     * Benefícios FREE são concedidos fora da transaction da rodada,
     * mas de forma determinística e idempotente
     */
    await GrantRoundBenefitsService.execute(roundId);
  }
}
