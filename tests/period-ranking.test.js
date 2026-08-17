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
const {
  EnsureMonthlyRankingsService,
} = require('../dist/services/ranking/ensure-monthly-rankings.service')
const {
  RankingWindowScoreService,
} = require('../dist/services/ranking/ranking-window-score.service')

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

test('ranking por período usa Super Duplas antes de Duplas e conta mais antiga', async t => {
  const originalHistory = prisma.userScoreHistory.findMany
  t.after(() => {
    prisma.userScoreHistory.findMany = originalHistory
  })

  prisma.userScoreHistory.findMany = async ({ where }) => {
    if (where.round?.closeAt?.gte) {
      return [
        history('user-double', 5, 8, 1, 'Duplas', '2025-01-01T00:00:00Z'),
        history('user-super-new', 5, 0, 2, 'Super nova', '2026-02-01T00:00:00Z'),
        history('user-super-old', 5, 0, 2, 'Super antiga', '2024-01-01T00:00:00Z'),
      ]
    }
    return []
  }

  const ranking = await GetWeeklyRankingService.execute('2026-28')

  assert.deepEqual(
    ranking.map(row => ({ userId: row.userId, position: row.position })),
    [
      { userId: 'user-super-old', position: 1 },
      { userId: 'user-super-new', position: 2 },
      { userId: 'user-double', position: 3 },
    ]
  )
})

test('ranking mensal exibe delta canonico da coorte persistida', async t => {
  const originalFindRanking = prisma.ranking.findFirst
  const originalEnsure = EnsureMonthlyRankingsService.execute
  const originalBuildRows = RankingWindowScoreService.buildRows
  t.after(() => {
    prisma.ranking.findFirst = originalFindRanking
    EnsureMonthlyRankingsService.execute = originalEnsure
    RankingWindowScoreService.buildRows = originalBuildRows
  })

  EnsureMonthlyRankingsService.execute = async () => ({ registrationOpen: true })
  prisma.ranking.findFirst = async () => ({
    id: 'global-july',
    name: 'Julho',
    type: 'GLOBAL',
    status: 'ACTIVE',
    startDate: new Date('2026-07-01T00:00:00Z'),
    endDate: new Date('2026-08-01T00:00:00Z'),
    periodRef: '2026-07',
    createdAt: new Date('2026-07-01T00:00:00Z'),
    participants: [{
      userId: 'user-1',
      user: { name: 'Um', subscription: null },
    }],
  })
  RankingWindowScoreService.buildRows = async () => [{
    participantId: 'participant-1',
    userId: 'user-1',
    score: 2,
    scoreRound: -1,
    position: 1,
    scoreInitial: 10,
    scoreTotalCurrent: 12,
    previousScore: 0,
    previousPosition: null,
  }]

  let payload = null
  const req = { query: { scope: 'general', period: '2026-07' }, session: {} }
  const res = { json: value => { payload = value; return res } }
  await MonthlyRankingController.handle(req, res, error => { throw error })

  assert.equal(payload.participants[0].points, 2)
})

test('consulta publica do ranking mensal nao sincroniza nem altera a coorte', async t => {
  const originalFindRanking = prisma.ranking.findFirst
  const originalEnsure = EnsureMonthlyRankingsService.execute
  const originalBuildRows = RankingWindowScoreService.buildRows
  t.after(() => {
    prisma.ranking.findFirst = originalFindRanking
    EnsureMonthlyRankingsService.execute = originalEnsure
    RankingWindowScoreService.buildRows = originalBuildRows
  })

  EnsureMonthlyRankingsService.execute = async () => {
    throw new Error('GET publico tentou escrever no banco')
  }
  prisma.ranking.findFirst = async () => ({
    id: 'global-august',
    name: 'Agosto',
    type: 'GLOBAL',
    status: 'ACTIVE',
    startDate: new Date('2026-08-01T03:00:00Z'),
    endDate: new Date('2026-09-01T02:59:59.999Z'),
    periodRef: '2026-08',
    createdAt: new Date('2026-08-01T03:00:00Z'),
    participants: [],
  })
  RankingWindowScoreService.buildRows = async () => []

  let payload = null
  const req = { query: { scope: 'general', period: '2026-08' }, session: {} }
  const res = { json: value => { payload = value; return res } }
  await MonthlyRankingController.handle(req, res, error => { throw error })

  assert.equal(payload.periodRef, '2026-08')
  assert.deepEqual(payload.participants, [])
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
  prisma.userScoreHistory.findMany = async ({ where }) =>
    where.round?.closeAt?.gte
      ? [
          history('user-1', 3, 2, 1, 'Um'),
          history('user-1', -1, 1, 1, 'Um'),
          history('user-2', 2, 0, 0, 'Dois'),
        ]
      : []
  return restore
}

function history(
  userId,
  scoreRound,
  totalDoubles,
  totalSuperDoubles,
  name,
  userCreatedAt = '2025-01-01T00:00:00Z'
) {
  return {
    userId,
    scoreRound,
    totalDoubles,
    totalSuperDoubles,
    createdAt: new Date('2026-07-09T12:00:00Z'),
    user: {
      name,
      createdAt: new Date(userCreatedAt),
      subscription: null,
    },
  }
}
