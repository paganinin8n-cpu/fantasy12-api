const assert = require('node:assert/strict')
const test = require('node:test')

const {
  BolaoPrizeService,
} = require('../dist/services/bolao/bolao-prize.service')

test('taxa usa piso de 10% e o restante inteiro fica no prêmio', () => {
  assert.deepEqual(BolaoPrizeService.calculatePool(33), {
    grossCollected: 33,
    platformFee: 3,
    prizePool: 30,
  })
})

test('empate combina as faixas ocupadas e divide o total entre empatados', () => {
  const payouts = BolaoPrizeService.calculatePayouts({
    prizePool: 90,
    prizeDistribution: [
      { position: 1, percentage: 60 },
      { position: 2, percentage: 30 },
      { position: 3, percentage: 10 },
    ],
    rows: [
      { userId: 'a', position: 1 },
      { userId: 'b', position: 1 },
      { userId: 'c', position: 3 },
    ],
  })

  assert.deepEqual(payouts, [
    { userId: 'a', position: 1, amount: 41 },
    { userId: 'b', position: 1, amount: 40 },
    { userId: 'c', position: 3, amount: 9 },
  ])
  assert.equal(payouts.reduce((sum, payout) => sum + payout.amount, 0), 90)
})

test('maiores restos distribuem todas as fichas do prêmio', () => {
  const payouts = BolaoPrizeService.calculatePayouts({
    prizePool: 10,
    prizeDistribution: [
      { position: 1, percentage: 34 },
      { position: 2, percentage: 33 },
      { position: 3, percentage: 33 },
    ],
    rows: [
      { userId: 'a', position: 1 },
      { userId: 'b', position: 2 },
      { userId: 'c', position: 3 },
    ],
  })

  assert.deepEqual(payouts.map(payout => payout.amount), [4, 3, 3])
  assert.equal(payouts.reduce((sum, payout) => sum + payout.amount, 0), 10)
})
