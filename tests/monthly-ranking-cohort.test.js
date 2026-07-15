const assert = require('node:assert/strict')
const test = require('node:test')

const { prisma } = require('../dist/lib/prisma')
const {
  EnsureMonthlyRankingsService,
} = require('../dist/services/ranking/ensure-monthly-rankings.service')

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
