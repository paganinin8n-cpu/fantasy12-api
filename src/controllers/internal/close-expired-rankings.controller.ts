import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { CloseRankingService } from '../../services/ranking/close-ranking.service';

export class CloseExpiredRankingsController {
  async execute(req: Request, res: Response) {
    const token = req.headers['x-internal-job-token'];

    if (token !== process.env.INTERNAL_JOB_SECRET) {
      return res.status(401).json({ error: 'Unauthorized job execution' });
    }

    const expiredRankings = await prisma.ranking.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { not: null, lt: new Date() },
      },
      select: { id: true },
    });

    const service = new CloseRankingService();

    for (const ranking of expiredRankings) {
      await service.execute(ranking.id);
    }

    return res.json({
      closedRankings: expiredRankings.length,
    });
  }
}
