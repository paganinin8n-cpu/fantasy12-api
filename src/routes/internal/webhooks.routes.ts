import { Router } from 'express'
import { MercadoPagoWebhookController } from '../../controllers/internal/mercado-pago-webhook.controller'
import { verifyMercadoPagoSignature } from '../../middleware/mercado-pago-signature.middleware'
import { webhookRateLimiter } from '../../middleware/rate-limit.middleware'

const router = Router()

/**
 * 🔔 Webhook Mercado Pago
 * ÚNICO ponto de entrada de eventos externos.
 * Validação HMAC-SHA256 obrigatória em produção.
 */
router.post(
  '/webhooks/mercado-pago',
  webhookRateLimiter,
  verifyMercadoPagoSignature,
  MercadoPagoWebhookController.handle
)

export default router
