import dotenv from 'dotenv'
import { loadBullmqConfig, summarizeRedisUrl } from './jobs/config'
import { createFantasy12Queue } from './jobs/create-queue'
import { createFantasy12Worker } from './jobs/create-worker'
import { registerFantasy12Schedules } from './jobs/register-schedules'
import {
  closeSharedRedisConnection,
} from './jobs/redis-connection'
import { createWorkerHealthServer, WorkerHealthState } from './jobs/health-server'
import { EnsureMonthlyRankingsJobService } from './services/jobs/ensure-monthly-rankings.job.service'
import { logger } from './lib/logger'
import { prisma } from './lib/prisma'

dotenv.config()

async function main() {
  const config = loadBullmqConfig()

  logger.info(
    {
      redis: summarizeRedisUrl(config.REDIS_URL),
      prefix: config.BULLMQ_PREFIX,
      concurrency: config.BULLMQ_WORKER_CONCURRENCY,
      registerSchedules: config.BULLMQ_REGISTER_SCHEDULES,
    },
    'Starting Fantasy12 BullMQ worker'
  )

  await prisma.$queryRaw`SELECT 1`

  const queue = createFantasy12Queue(config)
  const state: WorkerHealthState = {
    startedAt: new Date().toISOString(),
    schedulesRegistered: false,
    lastJobAt: null,
  }

  if (config.BULLMQ_REGISTER_SCHEDULES) {
    await registerFantasy12Schedules(queue)
    state.schedulesRegistered = true
  } else {
    logger.warn('BULLMQ_REGISTER_SCHEDULES=false — schedules not upserted')
    state.schedulesRegistered = true
  }

  // Startup reconciliation so a Redis outage at midnight does not skip the month
  try {
    const reconcile = await EnsureMonthlyRankingsJobService.execute({
      source: 'reconcile',
    })
    logger.info(
      {
        periodRef: reconcile.periodRef,
        generalAdded: reconcile.generalAdded,
        proAdded: reconcile.proAdded,
        executionStatus: reconcile.execution.status,
      },
      'Monthly rankings reconciled on worker startup'
    )
  } catch (err) {
    logger.error({ err }, 'Monthly rankings startup reconcile failed')
  }

  const worker = createFantasy12Worker(config)
  worker.on('completed', () => {
    state.lastJobAt = new Date().toISOString()
  })

  const healthServer = createWorkerHealthServer(
    config.WORKER_HEALTH_PORT,
    () => state,
    config.REDIS_URL
  )

  let shuttingDown = false
  const shutdown = async (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    logger.info({ signal }, 'Shutting down Fantasy12 worker')

    try {
      await worker.close()
      await queue.close()
      await new Promise<void>((resolve, reject) => {
        healthServer.close(err => (err ? reject(err) : resolve()))
      })
      await closeSharedRedisConnection()
      await prisma.$disconnect()
      logger.info('Fantasy12 worker stopped cleanly')
      process.exit(0)
    } catch (err) {
      logger.error({ err }, 'Fantasy12 worker shutdown failed')
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM')
  })
  process.on('SIGINT', () => {
    void shutdown('SIGINT')
  })
}

main().catch(err => {
  logger.error({ err }, 'Fantasy12 worker failed to start')
  process.exit(1)
})
