import { Queue, QueueOptions } from 'bullmq'
import { BullmqConfig } from './config'
import { FANTASY12_QUEUE_NAME } from './constants'
import { DEFAULT_JOB_OPTIONS } from './default-job-options'
import { getBullmqConnectionOptions } from './redis-connection'

export function createFantasy12Queue(config: BullmqConfig): Queue {
  const options: QueueOptions = {
    connection: getBullmqConnectionOptions(config.REDIS_URL),
    prefix: config.BULLMQ_PREFIX,
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  }

  return new Queue(FANTASY12_QUEUE_NAME, options)
}
