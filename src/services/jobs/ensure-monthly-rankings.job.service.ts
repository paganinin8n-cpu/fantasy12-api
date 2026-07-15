import { InternalJobRunnerService } from '../internal/internal-job-runner.service'
import { EnsureMonthlyRankingsService } from '../ranking/ensure-monthly-rankings.service'
import { periodRefFromDate } from '../../lib/period-ref'
import { SCHEDULE_TIMEZONE } from '../../jobs/constants'

export type EnsureMonthlyRankingsJobResult = {
  periodRef: string
  registrationOpen: boolean
  firstRoundId: string | null
  generalAdded: number
  proAdded: number
  execution: {
    id: string
    status: string
  }
}

/**
 * Ensures GLOBAL + PRO monthly rankings for the current Sao Paulo month.
 * Idempotent via EnsureMonthlyRankingsService upserts.
 */
export class EnsureMonthlyRankingsJobService {
  static async execute(options?: {
    now?: Date
    periodRef?: string
    source?: 'schedule' | 'reconcile' | 'manual'
  }): Promise<EnsureMonthlyRankingsJobResult> {
    const now = options?.now ?? new Date()
    const periodRef =
      options?.periodRef ?? periodRefFromDate(now, SCHEDULE_TIMEZONE)
    const source = options?.source ?? 'schedule'

    const result = await InternalJobRunnerService.execute({
      jobName: 'ENSURE_MONTHLY_RANKINGS',
      referenceId: `${periodRef}:${source}`,
      allowRepeat: true,
      run: async () =>
        EnsureMonthlyRankingsService.execute({
          periodRef,
          now,
        }),
    })

    const payload = result.result ?? {
      periodRef,
      registrationOpen: false,
      firstRoundId: null,
      generalAdded: 0,
      proAdded: 0,
    }

    return {
      periodRef: payload.periodRef,
      registrationOpen: payload.registrationOpen,
      firstRoundId: payload.firstRoundId,
      generalAdded: payload.generalAdded,
      proAdded: payload.proAdded,
      execution: {
        id: result.executionId,
        status: result.status,
      },
    }
  }
}
