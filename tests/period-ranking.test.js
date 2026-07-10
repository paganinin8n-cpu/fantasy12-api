const assert = require('node:assert/strict')
const test = require('node:test')

const { prisma } = require('../dist/lib/prisma')
const {
  GetWeeklyRankingService,
} = require('../dist/services/ranking/get-weekly-ranking.service')
const {
  GetSemesterRankingService,
} = require('../dist/services/ranking/get-semester-ranking.service')
const {
  MonthlyRankingController,
} = require('../dist/controllers/ranking/monthly-ranking.controller')

test('ranking semanal soma scoreRound do periodo sem depender de snapshot WEEKLY', async t => {
  const restore = mockHistory(t)
  const ranking = await GetWeeklyRankingService.execute('2026-28')
  restore()

  assert.deepEqual(
    ranking.map(row => ({ userId: row.userId, scoreTotal: row.scoreTotal, position: row.position })),
    [
      { userId: 'user-1', scoreTotal: 2, position: 1 },
      { userId: 'user-2', scoreTotal: 2, position: 2 },
    ]
  )
})

test('ranking semestral soma scoreRound do periodo sem periodRef mensal', async t => {
  const restore = mockHistory(t)
  const ranking = await GetSemesterRankingService.execute('2026-S2')
  restore()

  assert.equal(ranking.length, 2)
  assert.equal(ranking[0].scoreTotal, 2)
  assert.equal(ranking[0].scoreRound, 3)
})

test('ranking mensal exibe pontos do mes e nao acumulado global do snapshot', async t => {
  const originalFindRanking = prisma.ranking.findFirst
  const originalSnapshots = prisma.rankingSnapshot.findMany
  const originalHistory = prisma.userScoreHistory.findMany
  t.after(() => {
    prisma.ranking.findFirst = originalFindRanking
    prisma.rankingSnapshot.findMany = originalSnapshots
    prisma.userScoreHistory.findMany = originalHistory
  })

  prisma.ranking.findFirst = async () => ({
    id: 'global-july',
    name: 'Julho',
    type: 'GLOBAL',
    status: 'ACTIVE',
    startDate: new Date('2026-07-01T00:00:00Z'),
    endDate: new Date('2026-08-01T00:00:00Z'),
    createdAt: new Date('2026-07-01T00:00:00Z'),
  })
  prisma.rankingSnapshot.findMany = async () => [{
    userId: 'user-1',
    scoreTotal: 100,
    scoreRound: 3,
    createdAt: new Date('2026-07-09T12:00:00Z'),
    user: { name: 'Um', subscription: null },
  }]
  prisma.userScoreHistory.findMany = async () => [
    history('user-1', 3, 2, 1, 'Um'),
    history('user-1', -1, 1, 1, 'Um'),
  ]

  let payload = null
  const req = { query: { scope: 'general' }, session: {} }
  const res = { json: value => { payload = value; return res } }
  await MonthlyRankingController.handle(req, res, error => { throw error })

  assert.equal(payload.participants[0].points, 2)
})

function mockHistory(t) {
  const originalHistory = prisma.userScoreHistory.findMany
  const originalSnapshots = prisma.rankingSnapshot.findMany
  const restore = () => {
    prisma.userScoreHistory.findMany = originalHistory
    prisma.rankingSnapshot.findMany = originalSnapshots
  }
  t.after(restore)

  prisma.rankingSnapshot.findMany = async () => []
  prisma.userScoreHistory.findMany = async () => [
    history('user-1', 3, 2, 1, 'Um'),
    history('user-1', -1, 1, 1, 'Um'),
    history('user-2', 2, 0, 0, 'Dois'),
  ]
  return restore
}

function history(userId, scoreRound, totalDoubles, totalSuperDoubles, name) {
  return {
    userId,
    scoreRound,
    totalDoubles,
    totalSuperDoubles,
    createdAt: new Date('2026-07-09T12:00:00Z'),
    user: {
      name,
      subscription: null,
    },
  }
}
