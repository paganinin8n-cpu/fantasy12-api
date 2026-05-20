import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { hasActiveProSubscription } from '../../domain/subscription';

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

      const snapshots = await prisma.rankingSnapshot.findMany({
        where: {
          periodRef,
          snapshotType: 'GLOBAL',
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          userId: true,
          scoreTotal: true,
          scoreRound: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              subscription: {
                select: {
                  status: true,
                  plan: true,
                  endAt: true,
                },
              },
            },
          },
        },
      });

      const latestByUser = new Map<
        string,
        {
          userId: string;
          userName: string;
          scoreTotal: number;
          scoreRound: number;
          isPro: boolean;
        }
      >();

      for (const snapshot of snapshots) {
        if (latestByUser.has(snapshot.userId)) continue;

        latestByUser.set(snapshot.userId, {
          userId: snapshot.userId,
          userName: snapshot.user.name,
          scoreTotal: snapshot.scoreTotal,
          scoreRound: snapshot.scoreRound,
          isPro: hasActiveProSubscription(snapshot.user.subscription),
        });
      }

      const consolidated = Array.from(latestByUser.values())
        .filter(item => (scope === 'pro' ? item.isPro : true))
        .sort((a, b) => {
          if (b.scoreTotal !== a.scoreTotal) return b.scoreTotal - a.scoreTotal;
          if (b.scoreRound !== a.scoreRound) return b.scoreRound - a.scoreRound;
          return a.userId.localeCompare(b.userId);
        });

      let position = 1;
      let lastScoreTotal: number | null = null;
      let lastScoreRound: number | null = null;
      let index = 0;

      const ranked = consolidated.map(item => {
        index += 1;
        if (
          lastScoreTotal !== null &&
          (item.scoreTotal !== lastScoreTotal || item.scoreRound !== lastScoreRound)
        ) {
          position = index;
        }

        lastScoreTotal = item.scoreTotal;
        lastScoreRound = item.scoreRound;

        return {
          userId: item.userId,
          userName: item.userName,
          points: item.scoreTotal,
          position,
          isPro: item.isPro,
        };
      });

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
      });
    } catch (err) {
      next(err);
    }
  }
}
