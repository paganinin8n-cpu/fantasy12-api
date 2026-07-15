import IORedis from 'ioredis'
import type { ConnectionOptions } from 'bullmq'
import { loadBullmqConfig, summarizeRedisUrl } from './config'
import { logger } from '../lib/logger'

let sharedPingClient: IORedis | null = null

/**
 * Connection options for BullMQ Queue/Worker.
 * BullMQ creates and owns its Redis clients from these options.
 */
export function getBullmqConnectionOptions(
  redisUrl?: string
): ConnectionOptions {
  const url = new URL(redisUrl ?? loadBullmqConfig().REDIS_URL)

  return {
    host: url.hostname,
    port: Number(url.port || (url.protocol === 'rediss:' ? 6380 : 6379)),
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: Number(url.pathname.replace(/^\//, '') || 0),
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
  }
}

export function getSharedRedisPingClient(redisUrl?: string): IORedis {
  if (sharedPingClient) return sharedPingClient

  const url = redisUrl ?? loadBullmqConfig().REDIS_URL
  sharedPingClient = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  })

  sharedPingClient.on('error', err => {
    logger.error(
      { err, redis: summarizeRedisUrl(url) },
      'Redis ping client error'
    )
  })

  return sharedPingClient
}

export async function pingRedis(redisUrl?: string) {
  const client = getSharedRedisPingClient(redisUrl)
  const result = await client.ping()
  return result === 'PONG'
}

export async function closeSharedRedisConnection() {
  if (!sharedPingClient) return
  const current = sharedPingClient
  sharedPingClient = null
  await current.quit().catch(() => {
    current.disconnect()
  })
}
