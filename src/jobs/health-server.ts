import http from 'http'
import { pingRedis } from './redis-connection'
import { logger } from '../lib/logger'

export type WorkerHealthState = {
  startedAt: string
  schedulesRegistered: boolean
  lastJobAt: string | null
}

export function createWorkerHealthServer(
  port: number,
  getState: () => WorkerHealthState,
  redisUrl?: string
) {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/health' || req.url === '/ready') {
      try {
        const redisOk = await pingRedis(redisUrl)
        const state = getState()
        const ready = redisOk && state.schedulesRegistered
        const statusCode =
          req.url === '/ready'
            ? ready
              ? 200
              : 503
            : redisOk
              ? 200
              : 503

        res.writeHead(statusCode, { 'content-type': 'application/json' })
        res.end(
          JSON.stringify({
            worker: redisOk ? 'ok' : 'error',
            redis: redisOk ? 'ok' : 'error',
            ready,
            ...state,
            timestamp: new Date().toISOString(),
          })
        )
      } catch (err: any) {
        logger.error({ err }, 'Worker health check failed')
        res.writeHead(503, { 'content-type': 'application/json' })
        res.end(
          JSON.stringify({
            worker: 'error',
            redis: 'error',
            ready: false,
            timestamp: new Date().toISOString(),
          })
        )
      }
      return
    }

    res.writeHead(404, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: 'not_found' }))
  })

  server.listen(port, '0.0.0.0', () => {
    logger.info({ port }, 'Fantasy12 worker health server listening')
  })

  return server
}
