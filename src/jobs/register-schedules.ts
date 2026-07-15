import { Queue } from 'bullmq'
import {
  ENSURE_MONTHLY_CRON,
  EVERY_MINUTE_MS,
  JOB_NAMES,
  RECONCILE_MONTHLY_CRON,
  SCHEDULE_TIMEZONE,
  SCHEDULER_IDS,
} from './constants'
import { DEFAULT_JOB_OPTIONS } from './default-job-options'
import { logger } from '../lib/logger'

export type RegisteredSchedule = {
  schedulerId: string
  jobName: string
  everyMs?: number
  pattern?: string
  tz?: string
}

export function getRequiredSchedules(): RegisteredSchedule[] {
  return [
    {
      schedulerId: SCHEDULER_IDS.OPEN_SCHEDULED_ROUNDS,
      jobName: JOB_NAMES.OPEN_SCHEDULED_ROUNDS,
      everyMs: EVERY_MINUTE_MS,
    },
    {
      schedulerId: SCHEDULER_IDS.CLOSE_SCHEDULED_ROUNDS,
      jobName: JOB_NAMES.CLOSE_SCHEDULED_ROUNDS,
      everyMs: EVERY_MINUTE_MS,
    },
    {
      schedulerId: SCHEDULER_IDS.CLOSE_EXPIRED_RANKINGS,
      jobName: JOB_NAMES.CLOSE_EXPIRED_RANKINGS,
      everyMs: EVERY_MINUTE_MS,
    },
    {
      schedulerId: SCHEDULER_IDS.ENSURE_MONTHLY_RANKINGS,
      jobName: JOB_NAMES.ENSURE_MONTHLY_RANKINGS,
      pattern: ENSURE_MONTHLY_CRON,
      tz: SCHEDULE_TIMEZONE,
    },
    {
      schedulerId: SCHEDULER_IDS.RECONCILE_MONTHLY_RANKINGS,
      jobName: JOB_NAMES.RECONCILE_MONTHLY_RANKINGS,
      pattern: RECONCILE_MONTHLY_CRON,
      tz: SCHEDULE_TIMEZONE,
    },
  ]
}

export async function registerFantasy12Schedules(queue: Queue) {
  const schedules = getRequiredSchedules()

  for (const schedule of schedules) {
    const repeat =
      schedule.everyMs != null
        ? { every: schedule.everyMs }
        : { pattern: schedule.pattern!, tz: schedule.tz }

    await queue.upsertJobScheduler(schedule.schedulerId, repeat, {
      name: schedule.jobName,
      data: { source: 'bullmq-scheduler' },
      opts: DEFAULT_JOB_OPTIONS,
    })

    logger.info(
      {
        schedulerId: schedule.schedulerId,
        jobName: schedule.jobName,
        everyMs: schedule.everyMs,
        pattern: schedule.pattern,
        tz: schedule.tz,
      },
      'BullMQ schedule registered'
    )
  }

  return schedules
}
