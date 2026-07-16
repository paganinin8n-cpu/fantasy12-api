import { RoundRepository } from '../../repositories/round.repository';
import { RoundStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export class CloseRoundService {
  private repository = new RoundRepository();

  async execute(roundId: string) {
    const round = await this.repository.findById(roundId);

    if (!round) {
      throw new Error('Rodada não encontrada');
    }

    if (round.status !== RoundStatus.OPEN) {
      throw new Error('Somente rodadas OPEN podem ser fechadas');
    }

    const closedRound = await this.repository.updateStatus(roundId, RoundStatus.CLOSED);

    await prisma.roundBenefit.updateMany({
      where: { roundId },
      data: { freeDoubles: 0, freeSuperDoubles: 0 },
    });

    return closedRound;
  }
}
