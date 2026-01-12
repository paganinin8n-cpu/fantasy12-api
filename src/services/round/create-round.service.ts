import { RoundRepository } from '../../repositories/round.repository';

export class CreateRoundService {
  private repository = new RoundRepository();

  async execute(params: {
    openAt: Date;
    closeAt: Date;
  }) {
    const { openAt, closeAt } = params;

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
      closeAt
    });

    return {
      ...round,
      displayName
    };
  }
}
