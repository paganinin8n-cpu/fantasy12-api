import { RoundStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { InternalJobRunnerService } from '../internal/internal-job-runner.service'
import { OpenRoundService } from '../round/open-round.service'
import { EnsureMonthlyRankingsService } from '../ranking/ensure-monthly-rankings.service'
import { periodRefFromDate } from '../../lib/period-ref'

export type OpenScheduledRoundsResult = {
  opened: number
  skipped: number
  reason?: string
  openRound?: { id: string; number: number } | null
  roundId?: string
  execution?: { id: string; status: string } | null
}

/**
 * Opens the earliest DRAFT round whose openAt <= now, if no round is already OPEN.
 */
export class OpenScheduledRoundsJobService {
  static async execute(now = new Date()): Promise<OpenScheduledRoundsResult> {
    const alreadyOpenRound = await prisma.round.findFirst({
      where: { status: RoundStatus.OPEN },
      select: { id: true, number: true },
    })

    if (alreadyOpenRound) {
      return {
        opened: 0,
        skipped: 1,
        reason: 'round_already_open',
        openRound: alreadyOpenRound,
      }
    }

    const round = await prisma.round.findFirst({
      where: {
        status: RoundStatus.DRAFT,
        openAt: { lte: now },
      },
      orderBy: { openAt: 'asc' },
      select: { id: true, number: true, openAt: true, closeAt: true },
    })

    if (!round) {
      return {
        opened: 0,
        skipped: 0,
      }
    }

    const result = await InternalJobRunnerService.execute({
      jobName: 'OPEN_SCHEDULED_ROUND',
      referenceId: round.id,
      run: async () => {
        if (round.closeAt) {
          await EnsureMonthlyRankingsService.execute({
            periodRef: periodRefFromDate(round.closeAt),
            now,
          })
        }
        await OpenRoundService.execute(round.id)
        return {
          roundId: round.id,
          number: round.number,
          scheduledOpenAt: round.openAt?.toISOString() ?? null,
        }
      },
    })

    return {
      opened: result.status === 'SUCCESS' ? 1 : 0,
      skipped: result.status === 'IDEMPOTENT' ? 1 : 0,
      roundId: round.id,
      execution: {
        id: result.executionId,
        status: result.status,
      },
    }
  }
}
