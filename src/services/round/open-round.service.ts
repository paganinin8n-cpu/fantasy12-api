import { RoundRepository } from '../../repositories/round.repository';
import { RoundStatus } from '@prisma/client';

export class OpenRoundService {
  private repository = new RoundRepository();

  async execute(roundId: string) {
    const openRound = await this.repository.findOpenRound();

    if (openRound) {
      throw new Error('Já existe uma rodada aberta');
    }

    const round = await this.repository.findById(roundId);

    if (!round) {
      throw new Error('Rodada não encontrada');
    }

    if (round.status !== RoundStatus.CLOSED) {
      throw new Error('Somente rodadas CLOSED podem ser reabertas');
    }

    return this.repository.updateStatus(roundId, RoundStatus.OPEN);
  }
}
