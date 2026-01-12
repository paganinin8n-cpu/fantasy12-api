import { RoundRepository } from '../../repositories/round.repository';
import { RoundStatus } from '@prisma/client';

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

    return this.repository.updateStatus(roundId, RoundStatus.CLOSED);
  }
}
