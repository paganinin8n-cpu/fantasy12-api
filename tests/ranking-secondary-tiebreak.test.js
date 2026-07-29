const assert = require('node:assert/strict')
const test = require('node:test')

const { prisma } = require('../dist/lib/prisma')
const {
  GetMonthlyRankingService,
} = require('../dist/services/ranking/get-monthly-ranking.service')
const {
  SnapshotRankingService,
} = require('../dist/services/ranking/snapshot-ranking.service')

test('leitura mensal legada aplica Super Duplas antes da última rodada', async t => {
  const originalFindMany = prisma.rankingSnapshot.findMany
  t.after(() => {
    prisma.rankingSnapshot.findMany = originalFindMany
  })

  prisma.rankingSnapshot.findMany = async () => [
    snapshot('last-round', 10, 99, 10, 0, '2025-01-01T00:00:00Z'),
    snapshot('super-double', 10, 0, 0, 1, '2026-01-01T00:00:00Z'),
  ]

  const rows = await GetMonthlyRankingService.execute('2026-07')

  assert.deepEqual(
    rows.map(item => ({ userId: item.userId, position: item.position })),
    [
      { userId: 'super-double', position: 1 },
      { userId: 'last-round', position: 2 },
    ]
  )
})

test('snapshot global aplica a ordem oficial completa', async t => {
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.$transaction = originalTransaction
  })

  let created = null
  prisma.$transaction = async callback => callback({
    round: {
      findUnique: async () => ({
        id: 'round-1',
        status: 'SCORED',
        number: 1,
        updatedAt: new Date('2026-07-10T12:00:00Z'),
      }),
      findMany: async () => [{ id: 'round-1' }],
    },
    rankingSnapshot: {
      findFirst: async () => null,
      createMany: async ({ data }) => {
        created = data
      },
    },
    userScoreHistory: {
      findMany: async args => {
        if (args.where.roundId === 'round-1') {
          return [
            { userId: 'last-round', scoreRound: 99 },
            { userId: 'super-double', scoreRound: 0 },
          ]
        }
        return [
          history('last-round', 10, 10, 0, '2025-01-01T00:00:00Z'),
          history('super-double', 10, 0, 1, '2026-01-01T00:00:00Z'),
        ]
      },
    },
  })

  await SnapshotRankingService.execute('round-1')

  assert.deepEqual(
    created.map(item => ({ userId: item.userId, position: item.position })),
    [
      { userId: 'super-double', position: 1 },
      { userId: 'last-round', position: 2 },
    ]
  )
})

function snapshot(
  userId,
  scoreTotal,
  scoreRound,
  totalDoubles,
  totalSuperDoubles,
  userCreatedAt
) {
  return {
    userId,
    scoreTotal,
    scoreRound,
    totalDoubles,
    totalSuperDoubles,
    createdAt: new Date('2026-07-10T12:00:00Z'),
    user: { createdAt: new Date(userCreatedAt) },
  }
}

function history(
  userId,
  scoreTotal,
  totalDoubles,
  totalSuperDoubles,
  userCreatedAt
) {
  return {
    userId,
    scoreTotal,
    scoreRound: 0,
    totalDoubles,
    totalSuperDoubles,
    user: { createdAt: new Date(userCreatedAt) },
  }
}
