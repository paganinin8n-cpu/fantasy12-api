import { Router } from 'express';
import { MercadoPagoWebhookController } from '../../controllers/internal/mercado-pago-webhook.controller';

const router = Router();

/**
 * 🔔 Webhook Mercado Pago
 */
router.post(
  '/webhooks/mercado-pago',
  MercadoPagoWebhookController.handle
);

export default router;
