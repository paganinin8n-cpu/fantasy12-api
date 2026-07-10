const assert = require('node:assert/strict')
const test = require('node:test')

const { prisma } = require('../dist/lib/prisma')
const { MercadoPagoClient } = require('../dist/lib/mercado-pago.client')
const {
  CreatePaymentService,
} = require('../dist/services/payment/create-payment.service')
const {
  ProcessMercadoPagoWebhookService,
} = require('../dist/services/payment/process-mercado-pago-webhook.service')
const { WalletService } = require('../dist/services/wallet/wallet.service')

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

test('credita fichas e conclui pagamento aprovado na mesma transacao', async t => {
  const originalToken = process.env.MP_ACCESS_TOKEN
  const originalGetPayment = MercadoPagoClient.prototype.getPayment
  const originalTransaction = prisma.$transaction
  const originalCredit = WalletService.credit

  t.after(() => {
    process.env.MP_ACCESS_TOKEN = originalToken
    MercadoPagoClient.prototype.getPayment = originalGetPayment
    prisma.$transaction = originalTransaction
    WalletService.credit = originalCredit
  })

  process.env.MP_ACCESS_TOKEN = 'TEST-token'
  MercadoPagoClient.prototype.getPayment = async () => ({
    id: 654,
    status: 'approved',
    transaction_amount: 10,
    currency_id: 'BRL',
    external_reference: 'f12_payment-1',
  })

  const updates = []
  const transactionClient = {
    paymentWebhookEvent: {
      create: async ({ data }) => {
        assert.equal(data.externalEventId, '987')
      },
    },
    payment: {
      findUnique: async () => ({
        id: 'payment-1',
        userId: 'user-1',
        purpose: 'WALLET_CREDIT',
        status: 'PENDING',
        amountCents: 1000,
        coinsAmount: 20,
        bonusCoins: 5,
        externalReference: 'f12_payment-1',
        processedAt: null,
        subscriptionPlan: null,
      }),
      update: async args => updates.push(args),
    },
    auditLog: { create: async () => ({}) },
  }
  prisma.$transaction = async callback => callback(transactionClient)

  let credited = null
  WalletService.credit = async (userId, amount, description, tx) => {
    credited = { userId, amount, description, tx }
  }

  await ProcessMercadoPagoWebhookService.execute({
    id: 987,
    type: 'payment',
    data: { id: 654 },
  })

  assert.equal(credited.userId, 'user-1')
  assert.equal(credited.amount, 25)
  assert.equal(credited.tx, transactionClient)
  assert.equal(updates.length, 1)
  assert.equal(updates[0].data.status, 'APPROVED')
  assert.equal(updates[0].data.isCredited, true)
  assert.equal(updates[0].data.externalPaymentId, '654')
  assert.equal(updates[0].data.processedAt instanceof Date, true)
})
