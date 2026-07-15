const assert = require('node:assert/strict')
const test = require('node:test')

const {
  BolaoPrizeService,
} = require('../dist/services/bolao/bolao-prize.service')
const {
  SettleBolaoService,
} = require('../dist/services/bolao/settle-bolao.service')

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

test('fechamento credita os vencedores, persiste totais e não liquida duas vezes', async () => {
  const ledgers = []
  const balances = new Map()
  const rankingUpdates = []
  const audits = []
  const tx = {
    wallet: {
      upsert: async ({ where }) => ({ id: `wallet-${where.userId}` }),
      update: async ({ where, data }) => {
        balances.set(
          where.id,
          (balances.get(where.id) ?? 0) + data.balance.increment
        )
      },
    },
    walletLedger: {
      create: async ({ data }) => { ledgers.push(data); return data },
    },
    ranking: {
      update: async ({ data }) => { rankingUpdates.push(data); return data },
    },
    auditLog: {
      create: async ({ data }) => { audits.push(data); return data },
    },
  }
  const ranking = {
    id: 'mesa-1',
    grossCollected: 100,
    prizeDistribution: [
      { position: 1, percentage: 70 },
      { position: 2, percentage: 30 },
    ],
    settledAt: null,
  }
  const rows = [
    { userId: 'a', position: 1 },
    { userId: 'b', position: 2 },
  ]

  await SettleBolaoService.execute(tx, ranking, rows)
  await SettleBolaoService.execute(tx, { ...ranking, settledAt: new Date() }, rows)

  assert.deepEqual(ledgers.map(item => item.amount), [63, 27])
  assert.deepEqual(ledgers.map(item => item.idempotencyKey), [
    'bolao:payout:mesa-1:a',
    'bolao:payout:mesa-1:b',
  ])
  assert.equal(balances.get('wallet-a'), 63)
  assert.equal(balances.get('wallet-b'), 27)
  assert.equal(rankingUpdates.length, 1)
  assert.equal(rankingUpdates[0].platformFee, 10)
  assert.equal(rankingUpdates[0].prizePool, 90)
  assert.ok(rankingUpdates[0].settledAt instanceof Date)
  assert.equal(audits.length, 1)
})
