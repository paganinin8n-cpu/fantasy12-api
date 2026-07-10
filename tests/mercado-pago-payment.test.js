const assert = require('node:assert/strict')
const test = require('node:test')

const { prisma } = require('../dist/lib/prisma')
const { MercadoPagoClient } = require('../dist/lib/mercado-pago.client')
const {
  CreatePaymentService,
} = require('../dist/services/payment/create-payment.service')

test('cria preferencia do Mercado Pago ao iniciar compra de fichas', async t => {
  const originalToken = process.env.MP_ACCESS_TOKEN
  const originalFindPackage = prisma.paymentPackage.findUnique
  const originalFindUser = prisma.user.findUnique
  const originalTransaction = prisma.$transaction
  const originalCreatePreference = MercadoPagoClient.prototype.createPreference

  t.after(() => {
    process.env.MP_ACCESS_TOKEN = originalToken
    prisma.paymentPackage.findUnique = originalFindPackage
    prisma.user.findUnique = originalFindUser
    prisma.$transaction = originalTransaction
    MercadoPagoClient.prototype.createPreference = originalCreatePreference
  })

  process.env.MP_ACCESS_TOKEN = 'TEST-token'
  prisma.paymentPackage.findUnique = async () => ({
    id: 'coins_20',
    label: '20 fichas',
    isActive: true,
    amountCents: 1000,
    coinsAmount: 20,
    bonusCoins: 0,
  })
  prisma.user.findUnique = async () => ({
    id: 'user-1',
    name: 'Jogador',
    email: 'jogador@example.com',
  })
  prisma.$transaction = async callback => callback({
    payment: {
      create: async ({ data }) => ({ ...data, externalPaymentId: null }),
      update: async ({ data }) => data,
    },
    auditLog: { create: async () => ({}) },
  })

  let preferenceRequest = null
  MercadoPagoClient.prototype.createPreference = async (body, idempotencyKey) => {
    preferenceRequest = { body, idempotencyKey }
    return {
      id: 'preference-1',
      init_point: 'https://mercadopago.example/checkout',
    }
  }

  const result = await CreatePaymentService.execute({
    userId: 'user-1',
    packageId: 'coins_20',
    method: 'PIX',
  })

  assert.equal(result.checkoutUrl, 'https://mercadopago.example/checkout')
  assert.equal(result.preferenceId, 'preference-1')
  assert.equal(preferenceRequest.body.items[0].unit_price, 10)
  assert.equal(preferenceRequest.body.external_reference.startsWith('f12_'), true)
  assert.equal(preferenceRequest.idempotencyKey, result.paymentId)
})

test('normaliza IDs numericos recebidos no webhook do Mercado Pago', () => {
  const {
    normalizeMercadoPagoPaymentEvent,
  } = require('../dist/services/payment/mercado-pago-payment.helpers')

  assert.deepEqual(
    normalizeMercadoPagoPaymentEvent({ id: 987, data: { id: 654 } }),
    { externalEventId: '987', externalPaymentId: '654' }
  )
})

test('bloqueia conciliacao quando valor ou moeda divergem', () => {
  const {
    validateMercadoPagoPayment,
  } = require('../dist/services/payment/mercado-pago-payment.helpers')

  assert.deepEqual(
    validateMercadoPagoPayment(
      { amountCents: 1000, externalReference: 'f12_payment-1' },
      {
        transaction_amount: 9.99,
        currency_id: 'BRL',
        external_reference: 'f12_payment-1',
      }
    ),
    { valid: false, reason: 'amount_mismatch' }
  )

  assert.deepEqual(
    validateMercadoPagoPayment(
      { amountCents: 1000, externalReference: 'f12_payment-1' },
      {
        transaction_amount: 10,
        currency_id: 'USD',
        external_reference: 'f12_payment-1',
      }
    ),
    { valid: false, reason: 'currency_mismatch' }
  )
})
