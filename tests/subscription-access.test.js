const assert = require('node:assert/strict')
const test = require('node:test')

const {
  hasActiveProSubscription,
  hasAnnualProSubscription,
} = require('../dist/domain/subscription')

test('mantem acesso PRO cancelado ate o fim do periodo pago', () => {
  const subscription = {
    status: 'CANCELLED',
    plan: 'ANNUAL',
    endAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  }

  assert.equal(hasActiveProSubscription(subscription), true)
  assert.equal(hasAnnualProSubscription(subscription), true)
})

test('remove acesso PRO cancelado depois do fim do periodo pago', () => {
  const subscription = {
    status: 'CANCELLED',
    plan: 'MONTHLY',
    endAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  }

  assert.equal(hasActiveProSubscription(subscription), false)
})
