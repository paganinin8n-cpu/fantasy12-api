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
const {
  CreateBolaoInviteService,
} = require('../dist/services/bolao/create-bolao-invite.service')

const REGISTRATION_CLOSED = 'As inscrições para esta competição foram encerradas.'
const REGISTRATION_NOT_STARTED = 'As inscrições para esta competição ainda não começaram.'

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
  let createdStatus = null
  let createdMaxParticipants = undefined
  let createdEntryEndDate = null
  prisma.$transaction = async callback => callback({
    ranking: {
      create: async ({ data }) => {
        createdStatus = data.status
        createdMaxParticipants = data.maxParticipants
        createdEntryEndDate = data.entryEndDate
        return { ...data }
      },
      update: async ({ data }) => ({
        id: 'mesa-1',
        name: 'Mesa Oficial',
        status: 'DRAFT',
        entryFee: 10,
        maxParticipants: 50,
        currentParticipants: data.currentParticipants,
        startDate: new Date('2026-08-01T00:00:00Z'),
        entryEndDate: new Date('2026-08-04T12:00:00Z'),
        endDate: new Date('2026-08-31T23:59:59Z'),
      }),
    },
    round: {
      findFirst: async () => ({
        id: 'round-10',
        status: 'OPEN',
        closeAt: new Date('2026-08-05T12:00:00Z'),
      }),
    },
    rankingRound: {
      create: async ({ data }) => {
        linkedRound = data
      },
    },
    rankingParticipant: { create: async () => ({}) },
    wallet: {
      findUnique: async () => ({ id: 'wallet-1', balance: 20 }),
      updateMany: async () => ({ count: 1 }),
    },
    walletLedger: { create: async () => ({}) },
    user: { findUnique: async () => ({ scoreTotal: 0 }) },
    userScoreHistory: { findFirst: async () => null },
    auditLog: { create: async () => ({}) },
  })

  await CreateBolaoService.execute({
    name: 'Mesa Oficial',
    description: 'Premiação oficial 100% para o 1º colocado após a taxa.',
    startDate: new Date('2026-08-01T00:00:00Z'),
    entryEndDate: new Date('2026-08-04T12:00:00Z'),
    endDate: new Date('2026-08-31T23:59:59Z'),
    entryFee: 10,
    prizeDistribution: [{ position: 1, percentage: 100 }],
    createdByUserId: 'creator-1',
  })

  assert.deepEqual(linkedRound, {
    rankingId: linkedRound.rankingId,
    roundId: 'round-10',
  })
  assert.ok(linkedRound.rankingId)
  assert.equal(createdStatus, 'ACTIVE')
  assert.equal(createdMaxParticipants, null)
  assert.deepEqual(createdEntryEndDate, new Date('2026-08-04T12:00:00Z'))
})

test('bloqueia criacao de Mesa quando a primeira rodada ja fechou', async t => {
  const originalFindUnique = prisma.user.findUnique
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.user.findUnique = originalFindUnique
    prisma.$transaction = originalTransaction
  })

  prisma.user.findUnique = async () => ({
    id: 'creator-1',
    subscription: {
      status: 'ACTIVE', plan: 'MONTHLY', endAt: new Date('2027-01-01T00:00:00Z'),
    },
  })
  prisma.$transaction = async callback => callback({
    ranking: {
      create: async ({ data }) => ({ ...data }),
      update: async () => { throw new Error('nao deve atualizar Mesa fechada') },
    },
    round: {
      findFirst: async () => ({
        id: 'round-closed', status: 'CLOSED', closeAt: new Date('2026-07-01T12:00:00Z'),
      }),
    },
  })

  await assert.rejects(
    CreateBolaoService.execute({
      name: 'Mesa Tardia',
      description: 'Premiação oficial 100% para o primeiro colocado.',
      startDate: new Date('2026-07-01T00:00:00Z'),
      entryEndDate: new Date('2026-07-01T10:00:00Z'),
      endDate: new Date('2026-07-31T23:59:59Z'),
      entryFee: 10,
      prizeDistribution: [{ position: 1, percentage: 100 }],
      createdByUserId: 'creator-1',
    }),
    { message: REGISTRATION_CLOSED }
  )
})

test('bloqueia solicitacao antes da data de abertura da Mesa', async t => {
  const originalAssertPro = AssertActiveProUserService.execute
  const originalTransaction = prisma.$transaction
  t.after(() => {
    AssertActiveProUserService.execute = originalAssertPro
    prisma.$transaction = originalTransaction
  })

  AssertActiveProUserService.execute = async () => ({ id: 'user-2' })
  prisma.$transaction = async callback => callback({
    ranking: {
      findUnique: async () => ({
        ...openBolaoWithOpenFirstRound(),
        startDate: new Date('2099-08-01T00:00:00Z'),
        entryEndDate: new Date('2099-08-02T00:00:00Z'),
      }),
    },
    rankingParticipant: {
      findUnique: async () => null,
      create: async () => ({ id: 'participant-2' }),
    },
    auditLog: { create: async () => ({}) },
  })

  await assert.rejects(
    JoinBolaoService.execute({ rankingId: 'mesa-1', userId: 'user-2' }),
    { message: REGISTRATION_NOT_STARTED }
  )
})

test('bloqueia solicitacao depois do termino das entradas mesmo com rodada aberta', async t => {
  const originalAssertPro = AssertActiveProUserService.execute
  const originalTransaction = prisma.$transaction
  t.after(() => {
    AssertActiveProUserService.execute = originalAssertPro
    prisma.$transaction = originalTransaction
  })

  AssertActiveProUserService.execute = async () => ({ id: 'user-2' })
  prisma.$transaction = async callback => callback({
    ranking: {
      findUnique: async () => ({
        ...openBolaoWithOpenFirstRound(),
        startDate: new Date('2020-01-01T00:00:00Z'),
        entryEndDate: new Date('2020-01-02T00:00:00Z'),
      }),
    },
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

test('nao limita a quantidade de participantes da Mesa', async t => {
  const originalAssertPro = AssertActiveProUserService.execute
  const originalTransaction = prisma.$transaction
  t.after(() => {
    AssertActiveProUserService.execute = originalAssertPro
    prisma.$transaction = originalTransaction
  })

  AssertActiveProUserService.execute = async () => ({ id: 'user-501' })
  prisma.$transaction = async callback => callback({
    ranking: {
      findUnique: async () => ({
        ...openBolaoWithOpenFirstRound(),
        startDate: new Date('2020-01-01T00:00:00Z'),
        entryEndDate: new Date('2099-08-02T00:00:00Z'),
        maxParticipants: 50,
        currentParticipants: 500,
      }),
    },
    rankingParticipant: {
      findUnique: async () => null,
      create: async () => ({ id: 'participant-501' }),
    },
    auditLog: { create: async () => ({}) },
  })

  const result = await JoinBolaoService.execute({
    rankingId: 'mesa-1',
    userId: 'user-501',
  })

  assert.equal(result.status, 'PENDING')
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
    user: { findUnique: async () => ({ scoreTotal: 0 }) },
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

test('bloqueia a criacao de convite depois do fechamento da primeira rodada', async t => {
  const originalAssertPro = AssertActiveProUserService.execute
  const originalFindUnique = prisma.ranking.findUnique
  const originalInviteCreate = prisma.bolaoInvite.create
  const originalAuditCreate = prisma.auditLog.create
  t.after(() => {
    AssertActiveProUserService.execute = originalAssertPro
    prisma.ranking.findUnique = originalFindUnique
    prisma.bolaoInvite.create = originalInviteCreate
    prisma.auditLog.create = originalAuditCreate
  })

  AssertActiveProUserService.execute = async () => ({ id: 'creator-1' })
  prisma.ranking.findUnique = async () => openBolaoWithClosedFirstRound()
  prisma.bolaoInvite.create = async ({ data }) => ({
    id: 'invite-1',
    code: data.code,
    maxUses: null,
    expiresAt: null,
    isActive: true,
    createdAt: new Date(),
  })
  prisma.auditLog.create = async () => ({})

  await assert.rejects(
    CreateBolaoInviteService.execute({
      rankingId: 'mesa-1',
      createdByUserId: 'creator-1',
    }),
    { message: REGISTRATION_CLOSED }
  )
})

function openBolaoWithClosedFirstRound() {
  return {
    id: 'mesa-1',
    type: 'BOLAO',
    status: 'ACTIVE',
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

function openBolaoWithOpenFirstRound() {
  return {
    id: 'mesa-1',
    type: 'BOLAO',
    status: 'ACTIVE',
    entryFee: 0,
    maxParticipants: null,
    currentParticipants: 500,
    createdByUserId: 'creator-1',
    rounds: [{
      round: {
        number: 10,
        status: 'OPEN',
        closeAt: new Date('2099-08-03T12:00:00Z'),
      },
    }],
  }
}
