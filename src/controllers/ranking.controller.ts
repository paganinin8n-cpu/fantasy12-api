import { Request, Response } from 'express';
import { GetRankingService } from '../services/ranking/get-ranking.service';
// import { CloseExpiredRankingsService } from '../services/ranking/close-expired-rankings.service';
import { AddParticipantService } from '../services/ranking/add-participant.service';

export class RankingController {
  async show(req: Request, res: Response) {
    const { rankingId } = req.params;

    // ❌ REMOVIDO — job NÃO roda em GET
    // await new CloseExpiredRankingsService().execute();

    const service = new GetRankingService();
    const ranking = await service.execute(rankingId);

    return res.json(ranking);
  }

  async addParticipant(req: Request, res: Response) {
    const { rankingId } = req.params;
    const { userId } = req.body;

    const service = new AddParticipantService();

    const participant = await service.execute({
      rankingId,
      userId
    });

    return res.status(201).json(participant);
  }
}
