const assert = require('node:assert/strict')
const test = require('node:test')

const { prisma } = require('../dist/lib/prisma')
const {
  AssertActiveProUserService,
} = require('../dist/services/subscription/assert-active-pro-user.service')
const {
  CreateBolaoService,
} = require('../dist/services/bolao/create-bolao.service')
const {
  JoinBolaoService,
} = require('../dist/services/bolao/join-bolao.service')
const {
  ReviewBolaoRequestService,
} = require('../dist/services/bolao/review-bolao-request.service')

const REGISTRATION_CLOSED = 'As inscrições para esta competição foram encerradas.'

test('criacao da Mesa vincula a primeira rodada da janela', async t => {
  const originalFindUnique = prisma.user.findUnique
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.user.findUnique = originalFindUnique
    prisma.$transaction = originalTransaction
  })

  prisma.user.findUnique = async () => ({
    id: 'creator-1',
    subscription: {
      status: 'ACTIVE',
      plan: 'MONTHLY',
      endAt: new Date('2027-01-01T00:00:00Z'),
    },
  })

  let linkedRound = null
  prisma.$transaction = async callback => callback({
    ranking: {
      create: async ({ data }) => ({ ...data }),
      update: async ({ data }) => ({
        id: 'mesa-1',
        name: 'Mesa Oficial',
        status: 'DRAFT',
        entryFee: 10,
        maxParticipants: 50,
        currentParticipants: data.currentParticipants,
        startDate: new Date('2026-08-01T00:00:00Z'),
        endDate: new Date('2026-08-31T23:59:59Z'),
      }),
    },
    round: {
      findFirst: async () => ({ id: 'round-10' }),
    },
    rankingRound: {
      create: async ({ data }) => {
        linkedRound = data
      },
    },
    rankingParticipant: { create: async () => ({}) },
    userScoreHistory: { findFirst: async () => null },
    auditLog: { create: async () => ({}) },
  })

  await CreateBolaoService.execute({
    name: 'Mesa Oficial',
    startDate: new Date('2026-08-01T00:00:00Z'),
    endDate: new Date('2026-08-31T23:59:59Z'),
    entryFee: 10,
    createdByUserId: 'creator-1',
  })

  assert.deepEqual(linkedRound, {
    rankingId: linkedRound.rankingId,
    roundId: 'round-10',
  })
  assert.ok(linkedRound.rankingId)
})

test('bloqueia nova solicitacao depois do fechamento da primeira rodada', async t => {
  const originalAssertPro = AssertActiveProUserService.execute
  const originalTransaction = prisma.$transaction
  t.after(() => {
    AssertActiveProUserService.execute = originalAssertPro
    prisma.$transaction = originalTransaction
  })

  AssertActiveProUserService.execute = async () => ({ id: 'user-2' })
  prisma.$transaction = async callback => callback({
    ranking: { findUnique: async () => openBolaoWithClosedFirstRound() },
    rankingParticipant: {
      findUnique: async () => null,
      create: async () => ({ id: 'participant-2' }),
    },
    auditLog: { create: async () => ({}) },
  })

  await assert.rejects(
    JoinBolaoService.execute({ rankingId: 'mesa-1', userId: 'user-2' }),
    { message: REGISTRATION_CLOSED }
  )
})

test('bloqueia aprovacao pendente depois do fechamento da primeira rodada', async t => {
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.$transaction = originalTransaction
  })

  prisma.$transaction = async callback => callback({
    ranking: {
      findUnique: async () => openBolaoWithClosedFirstRound(),
      update: async () => ({}),
    },
    rankingParticipant: {
      findUnique: async () => ({
        id: 'participant-2',
        rankingId: 'mesa-1',
        userId: 'user-2',
        status: 'PENDING',
      }),
      update: async ({ data }) => ({ id: 'participant-2', ...data }),
    },
    userScoreHistory: { findFirst: async () => null },
    auditLog: { create: async () => ({}) },
  })

  await assert.rejects(
    ReviewBolaoRequestService.execute({
      rankingId: 'mesa-1',
      participantId: 'participant-2',
      reviewerUserId: 'creator-1',
      status: 'APPROVED',
    }),
    { message: REGISTRATION_CLOSED }
  )
})

function openBolaoWithClosedFirstRound() {
  return {
    id: 'mesa-1',
    type: 'BOLAO',
    status: 'DRAFT',
    entryFee: 0,
    maxParticipants: 50,
    currentParticipants: 1,
    createdByUserId: 'creator-1',
    rounds: [{
      round: {
        number: 10,
        status: 'CLOSED',
        closeAt: new Date('2026-07-01T12:00:00Z'),
      },
    }],
  }
}
