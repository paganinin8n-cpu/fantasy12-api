import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

/**
 * Verifica a assinatura HMAC-SHA256 enviada pelo Mercado Pago
 * em webhooks. Sem essa verificação qualquer pessoa pode forjar
 * eventos de pagamento.
 *
 * Documentação:
 * https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks#bookmark_validar_a_origem_da_notifica%C3%A7%C3%A3o
 *
 * Manifest:
 *   id:[data.id];request-id:[x-request-id];ts:[ts];
 *
 * Signature header esperado:
 *   ts=TIMESTAMP,v1=HASH_HEX
 */
export function verifyMercadoPagoSignature(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  const secrets = [
    process.env.MP_WEBHOOK_SECRET,
    process.env.MP_TEST_WEBHOOK_SECRET,
  ].filter((value): value is string => Boolean(value))
  const allowUnsignedTestWebhooks =
    process.env.MP_ALLOW_UNSIGNED_TEST_WEBHOOKS === 'true' &&
    process.env.MP_ACCESS_TOKEN?.startsWith('TEST-')

  // Em ambientes de desenvolvimento permitimos pular a validação
  // explicitamente para facilitar testes locais. Em producao, a unica
  // excecao aceita e sandbox Mercado Pago com token TEST-* e flag explicita.
  if (secrets.length === 0) {
    if (allowUnsignedTestWebhooks) {
      console.warn({
        level: 'WARN',
        service: 'verifyMercadoPagoSignature',
        message:
          'MP_WEBHOOK_SECRET ausente - assinatura ignorada somente para sandbox TEST',
      })
      return next()
    }

    if (process.env.NODE_ENV === 'production') {
      console.error({
        level: 'ERROR',
        service: 'verifyMercadoPagoSignature',
        message: 'MP_WEBHOOK_SECRET nao configurado em producao',
      })
      return res.status(500).json({ error: 'webhook_secret_not_configured' })
    }

    console.warn({
      level: 'WARN',
      service: 'verifyMercadoPagoSignature',
      message:
        'MP_WEBHOOK_SECRET nao configurado - assinatura NAO sera validada (somente dev)',
    })
    return next()
  }

  const legacyTopic = req.query.topic
  const legacyPaymentId = req.query.id
  if (
    legacyTopic === 'payment' &&
    typeof legacyPaymentId === 'string' &&
    /^\d+$/.test(legacyPaymentId)
  ) {
    // Legacy IPN may include headers that do not sign the modern manifest.
    // The handler uses only this ID and validates the payment through MP.
    return next()
  }

  const signatureHeader = req.headers['x-signature']
  const requestId = req.headers['x-request-id']

  if (typeof signatureHeader !== 'string' || typeof requestId !== 'string') {
    return res.status(401).json({ error: 'missing_signature_headers' })
  }

  // Parse do header: "ts=...,v1=..."
  const parts = signatureHeader.split(',').reduce<Record<string, string>>(
    (acc, part) => {
      const [key, value] = part.split('=').map(s => s.trim())
      if (key && value) acc[key] = value
      return acc
    },
    {}
  )

  const ts = parts['ts']
  const v1 = parts['v1']

  if (!ts || !v1) {
    return res.status(401).json({ error: 'malformed_signature_header' })
  }

  // O id que entra no manifest vem do query string `data.id`
  // (não do body — body pode ser modificado por proxies).
  const dataId =
    (req.query['data.id'] as string | undefined) ??
    (req.body?.data?.id as string | undefined)

  if (!dataId) {
    return res.status(400).json({ error: 'missing_data_id' })
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const receivedBuf = Buffer.from(v1, 'hex')
  const expectedSignatures = secrets.map(secret =>
    crypto.createHmac('sha256', secret).update(manifest).digest('hex')
  )
  const valid = expectedSignatures.some(expected => {
    const expectedBuf = Buffer.from(expected, 'hex')
    return (
      expectedBuf.length === receivedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, receivedBuf)
    )
  })

  if (!valid) {
    console.warn({
      level: 'WARN',
      service: 'verifyMercadoPagoSignature',
      message: 'Assinatura invalida',
      requestId,
      dataId,
      timestamp: ts,
      manifest,
      expectedSignatures,
      receivedSignature: v1,
    })
    return res.status(401).json({ error: 'invalid_signature' })
  }

  return next()
}
