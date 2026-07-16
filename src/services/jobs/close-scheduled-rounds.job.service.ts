import { RoundStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { InternalJobRunnerService } from '../internal/internal-job-runner.service'
import { CloseRoundService } from '../round/close-round.service'
import { EnsureMonthlyRankingsService } from '../ranking/ensure-monthly-rankings.service'
import { periodRefFromDate } from '../../lib/period-ref'

export type CloseScheduledRoundsResult = {
  closed: number
  skipped: number
  executions: Array<{
    roundId: string
    number: number
    executionId: string
    status: string
  }>
}

/**
 * Closes OPEN rounds whose closeAt <= now (prediction window only).
 */
export class CloseScheduledRoundsJobService {
  static async execute(now = new Date()): Promise<CloseScheduledRoundsResult> {
    const closeRoundService = new CloseRoundService()

    const rounds = await prisma.round.findMany({
      where: {
        status: RoundStatus.OPEN,
        closeAt: { lte: now },
      },
      orderBy: { closeAt: 'asc' },
      select: { id: true, number: true, closeAt: true },
    })

    const executions = []

    for (const round of rounds) {
      const result = await InternalJobRunnerService.execute({
        jobName: 'CLOSE_ROUND_PREDICTIONS',
        referenceId: round.id,
        run: async () => {
          if (round.closeAt) {
            await EnsureMonthlyRankingsService.execute({
              periodRef: periodRefFromDate(round.closeAt),
              now: new Date(round.closeAt.getTime() - 1),
            })
          }
          await closeRoundService.execute(round.id)
          return {
            roundId: round.id,
            number: round.number,
            scheduledCloseAt: round.closeAt?.toISOString() ?? null,
          }
        },
      })

      executions.push({
        roundId: round.id,
        number: round.number,
        executionId: result.executionId,
        status: result.status,
      })
    }

    return {
      closed: executions.filter(item => item.status === 'SUCCESS').length,
      skipped: executions.filter(item => item.status === 'IDEMPOTENT').length,
      executions,
    }
  }
}
