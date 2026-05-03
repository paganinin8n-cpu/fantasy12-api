import rateLimit from 'express-rate-limit'

/**
 * Limites configurados via env, com defaults seguros.
 *
 * Política:
 * - login: muito restritivo, anti brute-force
 * - payment / ticket: restritivo, anti spam
 * - global: relaxado, defesa em profundidade contra abuso geral
 */

const isProduction = process.env.NODE_ENV === 'production'

// Em ambiente de teste/dev, deixamos limits altos para não atrapalhar.
const SCALE = isProduction ? 1 : 10

/**
 * 🛡️ Login: 5 tentativas a cada 15 minutos por IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5 * SCALE,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'too_many_login_attempts',
    message: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
  },
})

/**
 * 💸 Pagamento: 10 criações de pagamento por minuto por IP
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10 * SCALE,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'too_many_payment_requests',
    message: 'Muitas tentativas de pagamento. Aguarde alguns instantes.',
  },
})

/**
 * 🎟️ Ticket: 20 envios por minuto por IP
 */
export const ticketRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20 * SCALE,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'too_many_ticket_requests',
    message: 'Você está enviando bilhetes muito rápido. Aguarde um instante.',
  },
})

/**
 * 🌐 Global: defesa em profundidade — N requisições / janela / IP
 */
export const globalRateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX ?? 100) * SCALE,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'too_many_requests',
    message: 'Muitas requisições. Aguarde alguns instantes.',
  },
})
