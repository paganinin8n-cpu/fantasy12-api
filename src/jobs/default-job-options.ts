import { DefaultJobOptions } from 'bullmq'

export const DEFAULT_JOB_OPTIONS: DefaultJobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 5_000,
  },
  removeOnComplete: {
    age: 24 * 60 * 60,
    count: 200,
  },
  removeOnFail: {
    age: 7 * 24 * 60 * 60,
    count: 500,
  },
}
