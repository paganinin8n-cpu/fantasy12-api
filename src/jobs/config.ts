import { z } from 'zod'

const boolFromEnv = z.preprocess(value => {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return value
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off', ''].includes(normalized)) return false
  return value
}, z.boolean())

const bullmqEnvSchema = z.object({
  REDIS_URL: z.string().min(1, 'REDIS_URL is required for the BullMQ worker'),
  BULLMQ_PREFIX: z.string().min(1).default('fantasy12'),
  BULLMQ_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(1),
  BULLMQ_REGISTER_SCHEDULES: boolFromEnv.default(true),
  WORKER_HEALTH_PORT: z.coerce.number().int().positive().default(3002),
})

export type BullmqConfig = z.infer<typeof bullmqEnvSchema>

export function loadBullmqConfig(
  env: NodeJS.ProcessEnv = process.env
): BullmqConfig {
  const parsed = bullmqEnvSchema.safeParse({
    REDIS_URL: env.REDIS_URL,
    BULLMQ_PREFIX: env.BULLMQ_PREFIX ?? 'fantasy12',
    BULLMQ_WORKER_CONCURRENCY: env.BULLMQ_WORKER_CONCURRENCY ?? '1',
    BULLMQ_REGISTER_SCHEDULES: env.BULLMQ_REGISTER_SCHEDULES ?? 'true',
    WORKER_HEALTH_PORT: env.WORKER_HEALTH_PORT ?? '3002',
  })

  if (!parsed.success) {
    const message = parsed.error.issues
      .map(issue => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ')
    throw new Error(`Invalid BullMQ configuration: ${message}`)
  }

  return parsed.data
}

/** Safe summary for logs — never includes credentials. */
export function summarizeRedisUrl(redisUrl: string): {
  protocol: string
  host: string
  port: string
  db: string
  hasAuth: boolean
} {
  try {
    const url = new URL(redisUrl)
    return {
      protocol: url.protocol.replace(':', ''),
      host: url.hostname || 'unknown',
      port: url.port || (url.protocol === 'rediss:' ? '6380' : '6379'),
      db: url.pathname.replace(/^\//, '') || '0',
      hasAuth: Boolean(url.password || url.username),
    }
  } catch {
    return {
      protocol: 'unknown',
      host: 'invalid',
      port: 'unknown',
      db: 'unknown',
      hasAuth: false,
    }
  }
}
