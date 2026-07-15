import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { hasActiveProSubscription } from '../../domain/subscription';
import { EnsureMonthlyRankingsService } from '../../services/ranking/ensure-monthly-rankings.service';
import { RankingWindowScoreService } from '../../services/ranking/ranking-window-score.service';

export class MonthlyRankingController {
  static async handle(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.session as any)?.user?.id ?? null;
      const scope = req.query.scope === 'pro' ? 'pro' : 'general';
      const now = new Date();
      const defaultPeriod = `${now.getUTCFullYear()}-${String(
        now.getUTCMonth() + 1
      ).padStart(2, '0')}`;
      const periodRef = typeof req.query.period === 'string'
        ? req.query.period
        : defaultPeriod;

      await EnsureMonthlyRankingsService.execute({ periodRef, now });

      const ranking = await prisma.ranking.findFirst({
        where: {
          type: scope === 'pro' ? 'PRO' : 'GLOBAL',
          periodRef,
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          periodRef: true,
          createdAt: true,
          participants: {
            where: { status: 'APPROVED' },
            select: {
              id: true,
              userId: true,
              score: true,
              scoreInitial: true,
              position: true,
              user: {
                select: {
                  name: true,
                  subscription: {
                    select: { status: true, plan: true, endAt: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!ranking) {
        throw new Error('Ranking mensal não encontrado');
      }

      const rows = ranking.status === 'CLOSED'
        ? ranking.participants.map(participant => ({
            participantId: participant.id,
            userId: participant.userId,
            score: participant.score,
            scoreRound: 0,
            position: participant.position ?? 0,
            scoreInitial: participant.scoreInitial,
            scoreTotalCurrent: participant.scoreInitial + participant.score,
            previousScore: participant.score,
            previousPosition: participant.position,
          }))
        : await RankingWindowScoreService.buildRows(prisma, ranking);
      const participantByUserId = new Map(
        ranking.participants.map(participant => [participant.userId, participant])
      );
      const ranked = rows.map(row => {
        const participant = participantByUserId.get(row.userId)!;
        return {
          userId: row.userId,
          userName: participant.user.name,
          points: row.score,
          position: row.position,
          isPro: hasActiveProSubscription(participant.user.subscription),
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

      const { participants: _participants, ...rankingPayload } = ranking;

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
