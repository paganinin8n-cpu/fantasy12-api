import { SessionData, Store } from 'express-session'
import IORedis from 'ioredis'
import { logger } from './logger'

type StoreCallback = (
  error?: unknown,
  session?: SessionData | null
) => void

export interface RedisSessionClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, mode: 'EX', ttl: number): Promise<unknown>
  del(...keys: string[]): Promise<unknown>
  sadd(key: string, value: string): Promise<unknown>
  srem(key: string, value: string): Promise<unknown>
  smembers(key: string): Promise<string[]>
  expire(key: string, ttl: number): Promise<unknown>
}

type RedisSessionStoreOptions = {
  idleTtlSeconds: number
  prefix?: string
  userPrefix?: string
}

export class RedisSessionStore extends Store {
  private readonly prefix: string
  private readonly userPrefix: string

  constructor(
    private readonly redis: RedisSessionClient,
    private readonly options: RedisSessionStoreOptions
  ) {
    super()
    this.prefix = options.prefix ?? 'f12:session:'
    this.userPrefix = options.userPrefix ?? 'f12:user-sessions:'
  }

  get(sid: string, callback: StoreCallback): void {
    this.redis
      .get(this.sessionKey(sid))
      .then(value => callback(undefined, value ? JSON.parse(value) : undefined))
      .catch(error => callback(error))
  }

  set(sid: string, value: SessionData, callback?: StoreCallback): void {
    this.persist(sid, value)
      .then(() => callback?.())
      .catch(error => callback?.(error))
  }

  touch(sid: string, value: SessionData, callback?: StoreCallback): void {
    this.set(sid, value, callback)
  }

  destroy(sid: string, callback?: StoreCallback): void {
    this.remove(sid)
      .then(() => callback?.())
      .catch(error => callback?.(error))
  }

  async revokeUserSessions(userId: string): Promise<void> {
    const indexKey = this.userKey(userId)
    const sessionIds = await this.redis.smembers(indexKey)

    if (sessionIds.length > 0) {
      await this.redis.del(...sessionIds.map(id => this.sessionKey(id)))
    }
    await this.redis.del(indexKey)
  }

  private async persist(sid: string, value: SessionData): Promise<void> {
    const ttl = this.ttlSeconds(value)
    await this.redis.set(
      this.sessionKey(sid),
      JSON.stringify(value),
      'EX',
      ttl
    )

    const userId = value.user?.id
    if (userId) {
      const indexKey = this.userKey(userId)
      await this.redis.sadd(indexKey, sid)
      await this.redis.expire(indexKey, ttl)
    }
  }

  private async remove(sid: string): Promise<void> {
    const key = this.sessionKey(sid)
    const serialized = await this.redis.get(key)
    await this.redis.del(key)

    if (!serialized) return
    const value = JSON.parse(serialized) as SessionData
    if (value.user?.id) {
      await this.redis.srem(this.userKey(value.user.id), sid)
    }
  }

  private ttlSeconds(value: SessionData): number {
    const cookieTtl = value.cookie?.maxAge
      ? Math.ceil(value.cookie.maxAge / 1000)
      : this.options.idleTtlSeconds
    return Math.max(1, Math.min(cookieTtl, this.options.idleTtlSeconds))
  }

  private sessionKey(sid: string): string {
    return `${this.prefix}${sid}`
  }

  private userKey(userId: string): string {
    return `${this.userPrefix}${userId}`
  }
}

let sharedStore: RedisSessionStore | null = null
let sharedClient: IORedis | null = null

export function getRedisSessionStore(
  redisUrl: string,
  idleTtlSeconds: number
): RedisSessionStore {
  if (sharedStore) return sharedStore

  const client = new IORedis(redisUrl, {
    enableReadyCheck: true,
    // Conecta sob demanda no boot via ensureRedisSessionStoreReady().
    // Mantém enableOfflineQueue=false para falhar rápido se o Redis cair
    // depois de pronto — sem isso o login fica pendurado no browser.
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 5_000,
    commandTimeout: 5_000,
  })
  client.on('error', error => {
    logger.error(
      { errorType: error.name },
      'Redis session store connection error'
    )
  })

  sharedClient = client
  sharedStore = new RedisSessionStore(client, { idleTtlSeconds })
  return sharedStore
}

/**
 * Garante que o client de sessão está ready antes de aceitar tráfego.
 * Sem isso, o primeiro login após o boot falha com:
 * "Stream isn't writeable and enableOfflineQueue options is false".
 */
export async function ensureRedisSessionStoreReady(
  timeoutMs = 10_000
): Promise<void> {
  if (!sharedClient) {
    throw new Error('Redis session store not initialized')
  }

  if (sharedClient.status === 'ready') return

  if (sharedClient.status === 'wait' || sharedClient.status === 'end') {
    await sharedClient.connect()
    return
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Redis session store connect timeout'))
    }, timeoutMs)

    const onReady = () => {
      cleanup()
      resolve()
    }
    const onError = (error: Error) => {
      cleanup()
      reject(error)
    }
    const cleanup = () => {
      clearTimeout(timeout)
      sharedClient?.off('ready', onReady)
      sharedClient?.off('error', onError)
    }

    sharedClient!.once('ready', onReady)
    sharedClient!.once('error', onError)
  })
}

export async function pingRedisSessionStore(): Promise<boolean> {
  if (!sharedClient || sharedClient.status !== 'ready') return false
  const result = await sharedClient.ping()
  return result === 'PONG'
}

export async function revokeUserSessions(userId: string): Promise<void> {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) throw new Error('REDIS_URL is required for session revocation')

  const idleTtlMinutes = Number(process.env.SESSION_IDLE_TTL_MIN ?? 30)
  const store = getRedisSessionStore(redisUrl, idleTtlMinutes * 60)
  await store.revokeUserSessions(userId)
}
