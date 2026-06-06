import { RoundRepository } from '../../repositories/round.repository';
import type { RoundMatchInput } from './round-match.types';

export class CreateRoundService {
  private repository = new RoundRepository();

  async execute(params: {
    openAt: Date;
    closeAt: Date;
    matches: RoundMatchInput[];
  }) {
    const { openAt, closeAt, matches } = params;

    if (openAt >= closeAt) {
      throw new Error('openAt deve ser anterior a closeAt');
    }

    const lastNumber = await this.repository.getLastRoundNumber();
    const nextNumber = lastNumber + 1;

    // Nome derivado (não persistido)
    const displayName = `Rodada ${String(nextNumber).padStart(3, '0')}`;

    const round = await this.repository.create({
      number: nextNumber,
      openAt,
      closeAt,
      matches
    });

    return {
      ...round,
      displayName
    };
  }
}
