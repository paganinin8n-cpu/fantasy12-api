import { InternalJobRunnerService } from '../internal/internal-job-runner.service'
import { CloseExpiredRankingsService } from '../ranking/close-expired-rankings.service'

export type CloseExpiredRankingsJobResult = {
  closedRankings: number
  execution: {
    id: string
    status: string
  }
}

/**
 * Sweep expired ACTIVE rankings and expired DRAFT BOLAO Mesas.
 * allowRepeat=true so minute schedules can run; domain services stay idempotent.
 */
export class CloseExpiredRankingsJobService {
  static async execute(): Promise<CloseExpiredRankingsJobResult> {
    const result = await InternalJobRunnerService.execute({
      jobName: 'CLOSE_EXPIRED_RANKINGS',
      referenceId: 'close-expired-rankings-sweep',
      allowRepeat: true,
      run: async () => {
        const closed = await new CloseExpiredRankingsService().execute()
        return { closedRankings: closed.closed }
      },
    })

    return {
      closedRankings: result.result?.closedRankings ?? 0,
      execution: {
        id: result.executionId,
        status: result.status,
      },
    }
  }
}
