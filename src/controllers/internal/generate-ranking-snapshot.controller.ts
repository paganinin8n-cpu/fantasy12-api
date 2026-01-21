import { Request, Response } from 'express';
import { SnapshotRankingService } from '../../services/ranking/snapshot-ranking.service';

export class GenerateRankingSnapshotController {
  static async handle(req: Request, res: Response) {
    const { roundId } = req.body;

    if (!roundId) {
      return res.status(400).json({
        error: 'roundId is required',
      });
    }

    try {
      await SnapshotRankingService.execute(roundId);

      return res.status(200).json({
        status: 'SNAPSHOT_GENERATED',
        roundId,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message ?? 'Snapshot generation failed',
      });
    }
  }
}
