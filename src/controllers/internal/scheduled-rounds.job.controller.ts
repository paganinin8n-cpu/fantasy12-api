import { Request, Response } from 'express';
import { RoundStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { InternalJobRunnerService } from '../../services/internal/internal-job-runner.service';
import { OpenRoundService } from '../../services/round/open-round.service';
import { CloseRoundService } from '../../services/round/close-round.service';
import { EnsureMonthlyRankingsService } from '../../services/ranking/ensure-monthly-rankings.service';

export class ScheduledRoundsJobController {
  async openScheduled(req: Request, res: Response): Promise<Response> {
    try {
      const now = new Date();

      const alreadyOpenRound = await prisma.round.findFirst({
        where: { status: RoundStatus.OPEN },
        select: { id: true, number: true },
      });

      if (alreadyOpenRound) {
        return res.status(200).json({
          status: 'ok',
          opened: 0,
          skipped: 1,
          reason: 'round_already_open',
          openRound: alreadyOpenRound,
        });
      }

      const round = await prisma.round.findFirst({
        where: {
          status: RoundStatus.DRAFT,
          openAt: { lte: now },
        },
        orderBy: { openAt: 'asc' },
        select: { id: true, number: true, openAt: true, closeAt: true },
      });

      if (!round) {
        return res.status(200).json({
          status: 'ok',
          opened: 0,
          skipped: 0,
        });
      }

      const result = await InternalJobRunnerService.execute({
        jobName: 'OPEN_SCHEDULED_ROUND',
        referenceId: round.id,
        run: async () => {
          if (round.closeAt) {
            await EnsureMonthlyRankingsService.execute({
              periodRef: this.periodRefFrom(round.closeAt),
              now,
            });
          }
          await OpenRoundService.execute(round.id);
          return {
            roundId: round.id,
            number: round.number,
            scheduledOpenAt: round.openAt?.toISOString() ?? null,
          };
        },
      });

      return res.status(200).json({
        status: 'ok',
        opened: result.status === 'SUCCESS' ? 1 : 0,
        skipped: result.status === 'IDEMPOTENT' ? 1 : 0,
        roundId: round.id,
        execution: {
          id: result.executionId,
          status: result.status,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message ?? 'Internal job error',
      });
    }
  }

  async closeScheduled(req: Request, res: Response): Promise<Response> {
    try {
      const now = new Date();
      const closeRoundService = new CloseRoundService();

      const rounds = await prisma.round.findMany({
        where: {
          status: RoundStatus.OPEN,
          closeAt: { lte: now },
        },
        orderBy: { closeAt: 'asc' },
        select: { id: true, number: true, closeAt: true },
      });

      const executions = [];

      for (const round of rounds) {
        const result = await InternalJobRunnerService.execute({
          jobName: 'CLOSE_ROUND_PREDICTIONS',
          referenceId: round.id,
          run: async () => {
            if (round.closeAt) {
              await EnsureMonthlyRankingsService.execute({
                periodRef: this.periodRefFrom(round.closeAt),
                now: new Date(round.closeAt.getTime() - 1),
              });
            }
            await closeRoundService.execute(round.id);
            return {
              roundId: round.id,
              number: round.number,
              scheduledCloseAt: round.closeAt?.toISOString() ?? null,
            };
          },
        });

        executions.push({
          roundId: round.id,
          number: round.number,
          executionId: result.executionId,
          status: result.status,
        });
      }

      return res.status(200).json({
        status: 'ok',
        closed: executions.filter(item => item.status === 'SUCCESS').length,
        skipped: executions.filter(item => item.status === 'IDEMPOTENT').length,
        executions,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message ?? 'Internal job error',
      });
    }
  }

  private periodRefFrom(date: Date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }
}
