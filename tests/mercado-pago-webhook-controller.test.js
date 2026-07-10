const assert = require('node:assert/strict')
const test = require('node:test')

const {
  ProcessMercadoPagoWebhookService,
} = require('../dist/services/payment/process-mercado-pago-webhook.service')
const {
  MercadoPagoWebhookController,
} = require('../dist/controllers/internal/mercado-pago-webhook.controller')

test('propaga falha do webhook para o error handler permitir retentativa', async t => {
  const originalExecute = ProcessMercadoPagoWebhookService.execute
  t.after(() => {
    ProcessMercadoPagoWebhookService.execute = originalExecute
  })

  const expectedError = new Error('temporary database failure')
  ProcessMercadoPagoWebhookService.execute = async () => {
    throw expectedError
  }

  const req = { body: { id: 1, type: 'payment', data: { id: 2 } } }
  const res = {
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
  let propagatedError = null

  await MercadoPagoWebhookController.handle(req, res, error => {
    propagatedError = error
  })

  assert.equal(propagatedError, expectedError)
  assert.equal(res.statusCode, null)
})
