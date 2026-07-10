import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { BuildMonthlyRankingFromHistoryService } from '../../services/ranking/build-monthly-ranking-from-history.service';

export class MonthlyRankingController {
  static async handle(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.session as any)?.user?.id ?? null;
      const scope = req.query.scope === 'pro' ? 'pro' : 'general';

      const globalRanking = await prisma.ranking.findFirst({
        where: {
          type: 'GLOBAL',
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,
        },
      });

      const proRanking =
        scope === 'pro'
          ? await prisma.ranking.findFirst({
              where: {
                type: 'PRO',
                status: 'ACTIVE',
              },
              select: {
                id: true,
                name: true,
                type: true,
                status: true,
                startDate: true,
                endDate: true,
                createdAt: true,
              },
            })
          : null;

      const ranking = scope === 'pro' ? proRanking ?? globalRanking : globalRanking;

      const refDate = ranking?.startDate ?? new Date();
      const year = refDate.getUTCFullYear();
      const month = String(refDate.getUTCMonth() + 1).padStart(2, '0');
      const periodRef = `${year}-${month}`;

      const rankingPayload =
        ranking ??
        ({
          id: `monthly-${scope}-${periodRef}`,
          name: scope === 'pro' ? 'Ranking PRO Mensal' : 'Ranking Geral Mensal',
          type: scope === 'pro' ? 'PRO' : 'GLOBAL',
          status: 'ACTIVE',
          startDate: new Date(Date.UTC(year, Number(month) - 1, 1)),
          endDate: null,
          createdAt: new Date(),
        } as const);

      const monthlyRows = await BuildMonthlyRankingFromHistoryService.execute({
        periodRef,
        scope,
      });
      const ranked = monthlyRows.map(item => ({
          userId: item.userId,
          userName: item.userName,
          points: item.monthlyPoints,
          position: item.position,
          isPro: item.isPro,
        }));

      const meEntry = userId ? ranked.find(item => item.userId === userId) ?? null : null;
      const me = userId
        ? {
            isParticipant: !!meEntry,
            position: meEntry?.position ?? null,
            score: meEntry?.points ?? null,
          }
        : null;

      return res.json({
        ranking: rankingPayload,
        participants: ranked.slice(0, 10),
        me,
        scope,
        periodRef,
        hasData: ranked.length > 0,
      });
    } catch (err) {
      next(err);
    }
  }
}
