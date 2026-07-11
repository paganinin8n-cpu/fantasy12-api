const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const test = require('node:test')

const {
  verifyMercadoPagoSignature,
} = require('../dist/middleware/mercado-pago-signature.middleware')

function response() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.payload = payload
      return this
    },
  }
}

test('aceita IPN legacy numerica para validacao posterior na API do MP', () => {
  const previousSecret = process.env.MP_WEBHOOK_SECRET
  process.env.MP_WEBHOOK_SECRET = 'configured-secret'

  let called = false
  const res = response()
  verifyMercadoPagoSignature(
    { headers: {}, query: { topic: 'payment', id: '167391550855' }, body: {} },
    res,
    () => { called = true }
  )

  if (previousSecret === undefined) delete process.env.MP_WEBHOOK_SECRET
  else process.env.MP_WEBHOOK_SECRET = previousSecret

  assert.equal(called, true)
  assert.equal(res.statusCode, null)
})

test('rejeita webhook moderno sem assinatura e formatos legacy invalidos', () => {
  const previousSecret = process.env.MP_WEBHOOK_SECRET
  process.env.MP_WEBHOOK_SECRET = 'configured-secret'

  for (const query of [
    {},
    { topic: 'payment', id: 'not-numeric' },
    { topic: 'merchant_order', id: '123' },
  ]) {
    let called = false
    const res = response()
    verifyMercadoPagoSignature(
      { headers: {}, query, body: { type: 'payment', data: { id: '123' } } },
      res,
      () => { called = true }
    )
    assert.equal(called, false)
    assert.equal(res.statusCode, 401)
    assert.deepEqual(res.payload, { error: 'missing_signature_headers' })
  }

  if (previousSecret === undefined) delete process.env.MP_WEBHOOK_SECRET
  else process.env.MP_WEBHOOK_SECRET = previousSecret
})

test('aceita assinatura gerada pela chave exclusiva do modo de teste', () => {
  const previousSecret = process.env.MP_WEBHOOK_SECRET
  const previousTestSecret = process.env.MP_TEST_WEBHOOK_SECRET
  process.env.MP_WEBHOOK_SECRET = 'production-secret'
  process.env.MP_TEST_WEBHOOK_SECRET = 'test-secret'

  const requestId = 'request-test-mode'
  const dataId = '167479197655'
  const timestamp = '1720710000'
  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`
  const signature = crypto
    .createHmac('sha256', 'test-secret')
    .update(manifest)
    .digest('hex')
  let called = false
  const res = response()

  verifyMercadoPagoSignature(
    {
      headers: {
        'x-request-id': requestId,
        'x-signature': `ts=${timestamp},v1=${signature}`,
      },
      query: { 'data.id': dataId },
      body: { type: 'payment', data: { id: dataId } },
    },
    res,
    () => { called = true }
  )

  if (previousSecret === undefined) delete process.env.MP_WEBHOOK_SECRET
  else process.env.MP_WEBHOOK_SECRET = previousSecret
  if (previousTestSecret === undefined) delete process.env.MP_TEST_WEBHOOK_SECRET
  else process.env.MP_TEST_WEBHOOK_SECRET = previousTestSecret

  assert.equal(called, true)
  assert.equal(res.statusCode, null)
})
