import pinoHttp from 'pino-http'
import { randomUUID } from 'crypto'
import { logger } from '../lib/logger'

/**
 * Middleware que:
 * - Anexa um logger por request com ID único (ou usa X-Request-Id se presente).
 * - Loga uma linha por request com método, status e tempo.
 * - Disponibiliza `req.log` em qualquer handler downstream.
 */
export const requestLogger = pinoHttp({
  logger,
  genReqId: req => {
    const incoming = req.headers['x-request-id']
    if (typeof incoming === 'string' && incoming.length > 0) return incoming
    return randomUUID()
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} → ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} → ${res.statusCode} (${err?.message})`,
  serializers: {
    req: req => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
    }),
    res: res => ({ statusCode: res.statusCode }),
  },
})
