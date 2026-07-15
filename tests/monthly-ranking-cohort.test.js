const assert = require('node:assert/strict')
const test = require('node:test')

const { prisma } = require('../dist/lib/prisma')
const {
  EnsureMonthlyRankingsService,
} = require('../dist/services/ranking/ensure-monthly-rankings.service')
const {
  RankingWindowScoreService,
} = require('../dist/services/ranking/ranking-window-score.service')
const {
  MonthlyRankingController,
} = require('../dist/controllers/ranking/monthly-ranking.controller')
const {
  ScheduledRoundsJobController,
} = require('../dist/controllers/internal/scheduled-rounds.job.controller')
const {
  InternalJobRunnerService,
} = require('../dist/services/internal/internal-job-runner.service')
const {
  OpenRoundService,
} = require('../dist/services/round/open-round.service')

test('cria rankings Geral e PRO do mes com primeira rodada e snapshots da coorte', async t => {
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.$transaction = originalTransaction
  })

  const rankings = []
  const linkedRounds = []
  const participantBatches = []

  prisma.$transaction = async callback => callback({
    round: {
      findFirst: async () => ({
        id: 'round-20',
        number: 20,
        status: 'OPEN',
        closeAt: new Date('2026-08-05T12:00:00Z'),
      }),
    },
    ranking: {
      findMany: async () => [],
      upsert: async ({ create }) => {
        rankings.push(create)
        return create
      },
    },
    rankingRound: {
      upsert: async ({ create }) => {
        linkedRounds.push(create)
        return create
      },
    },
    user: {
      findMany: async () => [
        user('normal-1', 12, null),
        user('pro-1', 25, activeSubscription()),
      ],
    },
    rankingParticipant: {
      createMany: async ({ data }) => {
        participantBatches.push(data)
        return { count: data.length }
      },
    },
    auditLog: { create: async () => ({}) },
  })

  const result = await EnsureMonthlyRankingsService.execute({
    periodRef: '2026-08',
    now: new Date('2026-08-02T12:00:00Z'),
  })

  assert.deepEqual(rankings.map(item => item.type), ['GLOBAL', 'PRO'])
  assert.ok(rankings.every(item => item.periodRef === '2026-08'))
  assert.deepEqual(linkedRounds.map(item => item.roundId), ['round-20', 'round-20'])
  assert.deepEqual(
    participantBatches[0].map(item => [item.userId, item.scoreInitial]),
    [['normal-1', 12], ['pro-1', 25]]
  )
  assert.deepEqual(
    participantBatches[1].map(item => [item.userId, item.scoreInitial]),
    [['pro-1', 25]]
  )
  assert.equal(result.registrationOpen, true)
})

test('nao admite novos participantes depois que a primeira rodada fecha', async t => {
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.$transaction = originalTransaction
  })

  let usersQueried = false
  let participantsCreated = false
  prisma.$transaction = async callback => callback({
    round: {
      findFirst: async () => ({
        id: 'round-20',
        number: 20,
        status: 'CLOSED',
        closeAt: new Date('2026-08-05T12:00:00Z'),
      }),
    },
    ranking: {
      findMany: async () => [
        { id: 'general', type: 'GLOBAL', _count: { participants: 1 } },
        { id: 'pro', type: 'PRO', _count: { participants: 1 } },
      ],
      upsert: async ({ create }) => create,
    },
    rankingRound: {
      upsert: async ({ create }) => create,
    },
    user: {
      findMany: async () => {
        usersQueried = true
        return [user('late-pro', 40, activeSubscription())]
      },
    },
    rankingParticipant: {
      createMany: async () => {
        participantsCreated = true
        return { count: 1 }
      },
    },
    auditLog: { create: async () => ({}) },
  })

  const result = await EnsureMonthlyRankingsService.execute({
    periodRef: '2026-08',
    now: new Date('2026-08-06T12:00:00Z'),
  })

  assert.equal(result.registrationOpen, false)
  assert.equal(usersQueried, false)
  assert.equal(participantsCreated, false)
})

test('rejeita periodo mensal invalido', async () => {
  await assert.rejects(
    EnsureMonthlyRankingsService.execute({
      periodRef: '2026-13',
      now: new Date('2026-08-01T00:00:00Z'),
    }),
    { message: 'Invalid month. Expected a value from 01 to 12' }
  )
})

test('endpoint mensal usa somente a coorte persistida no ranking', async t => {
  const originalEnsure = EnsureMonthlyRankingsService.execute
  const originalFindRanking = prisma.ranking.findFirst
  const originalBuildRows = RankingWindowScoreService.buildRows
  const originalHistory = prisma.userScoreHistory.findMany
  t.after(() => {
    EnsureMonthlyRankingsService.execute = originalEnsure
    prisma.ranking.findFirst = originalFindRanking
    RankingWindowScoreService.buildRows = originalBuildRows
    prisma.userScoreHistory.findMany = originalHistory
  })

  EnsureMonthlyRankingsService.execute = async () => ({ registrationOpen: false })
  prisma.ranking.findFirst = async () => ({
    id: 'monthly-GLOBAL-2026-08',
    name: 'Ranking Geral Mensal 2026-08',
    type: 'GLOBAL',
    status: 'ACTIVE',
    periodRef: '2026-08',
    startDate: new Date('2026-08-01T00:00:00Z'),
    endDate: new Date('2026-08-31T23:59:59.999Z'),
    createdAt: new Date('2026-08-01T00:00:00Z'),
    participants: [{
      userId: 'enrolled-1',
      user: { name: 'Inscrito', subscription: null },
    }],
  })
  RankingWindowScoreService.buildRows = async () => [{
    participantId: 'participant-1',
    userId: 'enrolled-1',
    score: 5,
    scoreRound: 2,
    position: 1,
    scoreInitial: 10,
    scoreTotalCurrent: 15,
    previousScore: 0,
    previousPosition: null,
  }]
  prisma.userScoreHistory.findMany = async () => [
    {
      userId: 'late-user',
      scoreRound: 100,
      totalDoubles: 0,
      totalSuperDoubles: 0,
      createdAt: new Date('2026-08-10T00:00:00Z'),
      user: { name: 'Atrasado', subscription: activeSubscription() },
    },
  ]

  let payload = null
  const req = {
    query: { scope: 'general', period: '2026-08' },
    session: {},
  }
  const res = { json: value => { payload = value; return res } }

  await MonthlyRankingController.handle(req, res, error => { throw error })

  assert.deepEqual(payload.participants, [{
    userId: 'enrolled-1',
    userName: 'Inscrito',
    points: 5,
    position: 1,
    isPro: false,
  }])
})

test('ranking mensal encerrado usa a pontuacao final congelada', async t => {
  const originalEnsure = EnsureMonthlyRankingsService.execute
  const originalFindRanking = prisma.ranking.findFirst
  const originalBuildRows = RankingWindowScoreService.buildRows
  t.after(() => {
    EnsureMonthlyRankingsService.execute = originalEnsure
    prisma.ranking.findFirst = originalFindRanking
    RankingWindowScoreService.buildRows = originalBuildRows
  })

  EnsureMonthlyRankingsService.execute = async () => ({ registrationOpen: false })
  prisma.ranking.findFirst = async () => ({
    id: 'monthly-GLOBAL-2026-07',
    name: 'Ranking Geral Mensal 2026-07',
    type: 'GLOBAL',
    status: 'CLOSED',
    periodRef: '2026-07',
    startDate: new Date('2026-07-01T00:00:00Z'),
    endDate: new Date('2026-07-31T23:59:59.999Z'),
    createdAt: new Date('2026-07-01T00:00:00Z'),
    participants: [{
      id: 'participant-1',
      userId: 'user-1',
      score: -3,
      scoreInitial: 10,
      position: 2,
      user: { name: 'Um', subscription: null },
    }],
  })
  RankingWindowScoreService.buildRows = async () => {
    throw new Error('closed ranking must not be recalculated')
  }

  let payload = null
  const req = {
    query: { scope: 'general', period: '2026-07' },
    session: {},
  }
  const res = { json: value => { payload = value; return res } }

  await MonthlyRankingController.handle(req, res, error => { throw error })

  assert.equal(payload.participants[0].points, -3)
  assert.equal(payload.participants[0].position, 2)
})

test('abertura automatica da rodada garante a coorte mensal antes de abrir palpites', async t => {
  const originalFindRound = prisma.round.findFirst
  const originalRunner = InternalJobRunnerService.execute
  const originalEnsure = EnsureMonthlyRankingsService.execute
  const originalOpenRound = OpenRoundService.execute
  t.after(() => {
    prisma.round.findFirst = originalFindRound
    InternalJobRunnerService.execute = originalRunner
    EnsureMonthlyRankingsService.execute = originalEnsure
    OpenRoundService.execute = originalOpenRound
  })

  let queryCount = 0
  prisma.round.findFirst = async () => {
    queryCount += 1
    if (queryCount === 1) return null
    return {
      id: 'round-20',
      number: 20,
      openAt: new Date('2026-08-02T10:00:00Z'),
      closeAt: new Date('2026-08-05T12:00:00Z'),
    }
  }
  InternalJobRunnerService.execute = async ({ run }) => ({
    executionId: 'job-1',
    status: 'SUCCESS',
    result: await run(),
  })

  let ensuredPeriod = null
  EnsureMonthlyRankingsService.execute = async ({ periodRef }) => {
    ensuredPeriod = periodRef
    return { registrationOpen: true }
  }
  let openedRound = null
  OpenRoundService.execute = async roundId => {
    openedRound = roundId
  }

  let payload = null
  const res = {
    status() { return res },
    json(value) { payload = value; return res },
  }

  await new ScheduledRoundsJobController().openScheduled({}, res)

  assert.equal(ensuredPeriod, '2026-08')
  assert.equal(openedRound, 'round-20')
  assert.equal(payload.opened, 1)
})

function user(id, scoreTotal, subscription) {
  return {
    id,
    scoreTotal,
    createdAt: new Date('2026-07-01T00:00:00Z'),
    subscription,
  }
}

function activeSubscription() {
  return {
    status: 'ACTIVE',
    startAt: new Date('2026-07-01T00:00:00Z'),
    endAt: new Date('2027-01-01T00:00:00Z'),
  }
}
