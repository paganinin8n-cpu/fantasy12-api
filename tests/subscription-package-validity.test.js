const assert = require('node:assert/strict')
const test = require('node:test')

const {
  SUBSCRIPTION_PLAN_OFFERS,
} = require('../dist/services/subscription/subscription-plans.config')
const {
  addSubscriptionValidityMonths,
} = require('../dist/services/subscription/renew-subscription-from-payment.service')

test('cada pacote define sua propria vigencia sem inferir pelo pagamento', () => {
  const byId = new Map(SUBSCRIPTION_PLAN_OFFERS.map(offer => [offer.id, offer]))

  assert.equal(byId.get('pro_monthly').validityMonths, 1)
  assert.equal(byId.get('pro_annual_pix').validityMonths, 12)
  assert.equal(byId.get('pro_annual_card').validityMonths, 12)
  assert.equal(byId.get('pro_annual_pix').badge, '12 meses de acesso')
})

test('vigencia usa meses de calendario e limita o ultimo dia do mes', () => {
  assert.equal(
    addSubscriptionValidityMonths(new Date('2026-01-31T15:00:00.000Z'), 1).toISOString(),
    '2026-02-28T15:00:00.000Z'
  )
  assert.equal(
    addSubscriptionValidityMonths(new Date('2026-08-15T15:00:00.000Z'), 12).toISOString(),
    '2027-08-15T15:00:00.000Z'
  )
})
