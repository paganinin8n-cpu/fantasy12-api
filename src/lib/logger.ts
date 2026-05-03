import pino from 'pino'

const isProd = process.env.NODE_ENV === 'production'

/**
 * Logger estruturado da aplicação.
 *
 * - Em produção: JSON puro, ideal para coletor (Loki, Datadog, etc.).
 * - Em dev: pretty-print com cores se `pino-pretty` estiver disponível.
 *
 * Uso:
 *   logger.info({ userId }, 'login realizado')
 *   logger.error({ err }, 'falha ao processar webhook')
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  // Não loga PII por padrão.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.newPassword',
      'req.body.token',
      '*.password',
      '*.token',
      '*.cpf',
    ],
    censor: '[redacted]',
  },
  // Em dev: pretty se disponível
  ...(isProd
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }),
})
