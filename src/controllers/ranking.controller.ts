import { Request, Response, NextFunction } from 'express';
import { GetRankingService } from '../services/ranking/get-ranking.service';
import { AddParticipantService } from '../services/ranking/add-participant.service';

export class RankingController {
  async show(req: Request, res: Response, next: NextFunction) {
    try {
      const { rankingId } = req.params;
      const service = new GetRankingService();
      const ranking = await service.execute(rankingId);
      return res.json(ranking);
    } catch (err) {
      next(err);
    }
  }

  async addParticipant(req: Request, res: Response, next: NextFunction) {
    try {
      const { rankingId } = req.params;
      const { userId } = req.body;

      const service = new AddParticipantService();
      const participant = await service.execute({
        rankingId,
        userId
      });

      return res.status(201).json(participant);
    } catch (err) {
      next(err);
    }
  }
}
