export const FANTASY12_QUEUE_NAME = 'fantasy12-jobs' as const

export const JOB_NAMES = {
  OPEN_SCHEDULED_ROUNDS: 'open-scheduled-rounds',
  CLOSE_SCHEDULED_ROUNDS: 'close-scheduled-rounds',
  CLOSE_EXPIRED_RANKINGS: 'close-expired-rankings',
  ENSURE_MONTHLY_RANKINGS: 'ensure-monthly-rankings',
  RECONCILE_MONTHLY_RANKINGS: 'reconcile-monthly-rankings',
} as const

export type Fantasy12JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES]

export const SCHEDULER_IDS = {
  OPEN_SCHEDULED_ROUNDS: 'scheduler:open-scheduled-rounds',
  CLOSE_SCHEDULED_ROUNDS: 'scheduler:close-scheduled-rounds',
  CLOSE_EXPIRED_RANKINGS: 'scheduler:close-expired-rankings',
  ENSURE_MONTHLY_RANKINGS: 'scheduler:ensure-monthly-rankings',
  RECONCILE_MONTHLY_RANKINGS: 'scheduler:reconcile-monthly-rankings',
} as const

export const SCHEDULE_TIMEZONE = 'America/Sao_Paulo'

/** Every minute */
export const EVERY_MINUTE_MS = 60_000

/** Hourly reconciliation cron (minute 5) in Sao Paulo */
export const RECONCILE_MONTHLY_CRON = '5 * * * *'

/** Day 1 at 00:00 America/Sao_Paulo */
export const ENSURE_MONTHLY_CRON = '0 0 1 * *'
