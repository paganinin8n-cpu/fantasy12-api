const assert = require('node:assert/strict')
const test = require('node:test')

const {
  createCsrfProtection,
} = require('../dist/middleware/csrf-protection.middleware')

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

function run(middleware, overrides = {}) {
  const req = {
    method: 'POST',
    path: '/api/benefits/purchase',
    headers: {},
    session: { user: { id: 'user-1' } },
    ...overrides,
  }
  const res = response()
  let nextCalled = false
  middleware(req, res, () => { nextCalled = true })
  return { res, nextCalled }
}

const middleware = createCsrfProtection({
  allowedOrigins: ['https://www.fantasy12.com'],
})

test('permite mutacao autenticada da origem oficial com JSON', () => {
  const result = run(middleware, {
    headers: {
      origin: 'https://www.fantasy12.com',
      'content-type': 'application/json; charset=utf-8',
      'content-length': '20',
    },
  })

  assert.equal(result.nextCalled, true)
  assert.equal(result.res.statusCode, null)
})

test('rejeita mutacao autenticada com origem ausente ou nao permitida', () => {
  for (const origin of [undefined, 'https://evil.example']) {
    const headers = origin ? { origin } : {}
    const result = run(middleware, { headers })
    assert.equal(result.nextCalled, false)
    assert.equal(result.res.statusCode, 403)
    assert.deepEqual(result.res.payload, {
      error: 'csrf_origin_rejected',
      message: 'Origem da requisicao nao autorizada.',
    })
  }
})

test('aceita referer oficial quando Origin nao esta disponivel', () => {
  const result = run(middleware, {
    headers: { referer: 'https://www.fantasy12.com/dashboard' },
  })
  assert.equal(result.nextCalled, true)
})

test('rejeita corpo autenticado que nao seja JSON', () => {
  const result = run(middleware, {
    headers: {
      origin: 'https://www.fantasy12.com',
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': '20',
    },
  })

  assert.equal(result.nextCalled, false)
  assert.equal(result.res.statusCode, 415)
  assert.equal(result.res.payload.error, 'json_content_type_required')
})

test('nao interfere em leitura, rota interna ou mutacao sem sessao autenticada', () => {
  const cases = [
    { method: 'GET' },
    { path: '/internal/webhooks/mercado-pago' },
    { session: {} },
  ]

  for (const overrides of cases) {
    const result = run(middleware, overrides)
    assert.equal(result.nextCalled, true)
    assert.equal(result.res.statusCode, null)
  }
})
