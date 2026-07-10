const assert = require('node:assert/strict')
const test = require('node:test')

const { prisma } = require('../dist/lib/prisma')
const {
  GetWeeklyRankingService,
} = require('../dist/services/ranking/get-weekly-ranking.service')
const {
  GetSemesterRankingService,
} = require('../dist/services/ranking/get-semester-ranking.service')

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
