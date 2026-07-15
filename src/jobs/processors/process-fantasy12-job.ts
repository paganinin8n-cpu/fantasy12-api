import { Job } from 'bullmq'
import { JOB_NAMES, Fantasy12JobName } from '../constants'
import { OpenScheduledRoundsJobService } from '../../services/jobs/open-scheduled-rounds.job.service'
import { CloseScheduledRoundsJobService } from '../../services/jobs/close-scheduled-rounds.job.service'
import { CloseExpiredRankingsJobService } from '../../services/jobs/close-expired-rankings.job.service'
import { EnsureMonthlyRankingsJobService } from '../../services/jobs/ensure-monthly-rankings.job.service'
import { logger } from '../../lib/logger'

export async function processFantasy12Job(job: Job) {
  const name = job.name as Fantasy12JobName

  logger.info(
    { jobId: job.id, jobName: name, attemptsMade: job.attemptsMade },
    'BullMQ job started'
  )

  switch (name) {
    case JOB_NAMES.OPEN_SCHEDULED_ROUNDS:
      return OpenScheduledRoundsJobService.execute()
    case JOB_NAMES.CLOSE_SCHEDULED_ROUNDS:
      return CloseScheduledRoundsJobService.execute()
    case JOB_NAMES.CLOSE_EXPIRED_RANKINGS:
      return CloseExpiredRankingsJobService.execute()
    case JOB_NAMES.ENSURE_MONTHLY_RANKINGS:
      return EnsureMonthlyRankingsJobService.execute({ source: 'schedule' })
    case JOB_NAMES.RECONCILE_MONTHLY_RANKINGS:
      return EnsureMonthlyRankingsJobService.execute({ source: 'reconcile' })
    default:
      throw new Error(`Unknown Fantasy12 job name: ${String(name)}`)
  }
}

export function listRoutableJobNames(): Fantasy12JobName[] {
  return Object.values(JOB_NAMES)
}
