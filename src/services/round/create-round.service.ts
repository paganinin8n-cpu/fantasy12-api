import { RoundRepository } from '../../repositories/round.repository';
import type { RoundMatchInput } from './round-match.types';
import { OfficialRoundScheduleService } from './official-round-schedule.service';

export class CreateRoundService {
  private repository = new RoundRepository();

  async execute(params: {
    matches: RoundMatchInput[];
    openAt?: Date | string | null;
    closeAt?: Date | string | null;
  }) {
    const { matches } = params;
    const { openAt, closeAt } = OfficialRoundScheduleService.resolve(matches, {
      openAt: params.openAt,
      closeAt: params.closeAt,
    });

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
