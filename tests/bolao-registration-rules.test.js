const assert = require('node:assert/strict')
const test = require('node:test')

const { prisma } = require('../dist/lib/prisma')
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

test('criacao da Mesa nao vincula rodada e nao auto-inscreve o criador', async t => {
  const originalFindUnique = prisma.user.findUnique
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.user.findUnique = originalFindUnique
    prisma.$transaction = originalTransaction
  })

  prisma.user.findUnique = async () => ({ id: 'admin-1' })

  let rankingData = null
  let rankingRoundCreated = false
  let participantCreated = false
  prisma.$transaction = async callback => callback({
    ranking: {
      create: async ({ data }) => {
        rankingData = data
        return { ...data }
      },
    },
    rankingRound: {
      create: async () => {
        rankingRoundCreated = true
      },
    },
    rankingParticipant: {
      create: async () => {
        participantCreated = true
        return {}
      },
    },
    auditLog: { create: async () => ({}) },
  })

  const result = await CreateBolaoService.execute({
    name: 'Mesa Oficial',
    description: 'Recompensa oficial 100% para o 1º colocado após a taxa.',
    startDate: new Date('2099-08-01T00:00:00Z'),
    entryEndDate: new Date('2099-08-04T12:00:00Z'),
    endDate: new Date('2099-08-31T23:59:59Z'),
    accessCost: 10,
    prizeDistribution: [{ position: 1, percentage: 100 }],
    createdByUserId: 'admin-1',
  })

  assert.equal(rankingRoundCreated, false)
  assert.equal(participantCreated, false)
  assert.equal(rankingData.status, 'ACTIVE')
  assert.equal(rankingData.maxParticipants, null)
  assert.equal(rankingData.currentParticipants, 0)
  assert.equal(rankingData.grossCollected, 0)
  assert.equal(rankingData.accessCost, 10)
  assert.equal(rankingData.entryFee, 10)
  assert.equal(rankingData.rewardPool, 0)
  assert.equal(rankingData.prizePool, 0)
  assert.equal(result.accessCost, 10)
  assert.equal(result.rewardPool, 0)
  assert.equal(result.currentParticipants, 0)
})

test('bloqueia criacao de Mesa quando o termino das entradas ja passou', async t => {
  const originalFindUnique = prisma.user.findUnique
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.user.findUnique = originalFindUnique
    prisma.$transaction = originalTransaction
  })

  prisma.user.findUnique = async () => ({ id: 'admin-1' })
  prisma.$transaction = async () => {
    throw new Error('nao deve abrir transaction com entradas encerradas')
  }

  await assert.rejects(
    CreateBolaoService.execute({
      name: 'Mesa Tardia',
      description: 'Premiação oficial 100% para o primeiro colocado.',
      startDate: new Date('2020-07-01T00:00:00Z'),
      entryEndDate: new Date('2020-07-02T00:00:00Z'),
      endDate: new Date('2020-07-31T23:59:59Z'),
      entryFee: 10,
      prizeDistribution: [{ position: 1, percentage: 100 }],
      createdByUserId: 'admin-1',
    }),
    (error) => {
      assert.equal(error.message, REGISTRATION_CLOSED)
      return true
    }
  )
})

test('bloqueia solicitacao antes da data de abertura da Mesa', async t => {
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.$transaction = originalTransaction
  })

  prisma.$transaction = async callback => callback({
    ranking: {
      findUnique: async () => ({
        ...openBolao(),
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

test('bloqueia solicitacao depois do termino das entradas', async t => {
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.$transaction = originalTransaction
  })

  prisma.$transaction = async callback => callback({
    ranking: {
      findUnique: async () => ({
        ...openBolao(),
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
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.$transaction = originalTransaction
  })

  prisma.$transaction = async callback => callback({
    ranking: {
      findUnique: async () => ({
        ...openBolao(),
        startDate: new Date('2020-01-01T00:00:00Z'),
        entryEndDate: new Date('2099-08-02T00:00:00Z'),
        maxParticipants: 50,
        currentParticipants: 500,
        entryFee: 0,
      }),
      update: async ({ data }) => data.grossCollected
        ? { grossCollected: 0 }
        : data,
    },
    rankingParticipant: {
      findUnique: async () => null,
      create: async ({ data }) => ({ id: 'participant-501', ...data }),
    },
    wallet: {
      findUnique: async () => ({ id: 'wallet-501', balance: 10 }),
      updateMany: async () => ({ count: 1 }),
    },
    walletLedger: { create: async () => ({}) },
    user: { findUnique: async () => ({ scoreTotal: 0 }) },
    userScoreHistory: { findFirst: async () => null },
    auditLog: { create: async () => ({}) },
  })

  const result = await JoinBolaoService.execute({
    rankingId: 'mesa-1',
    userId: 'user-501',
  })

  assert.equal(result.status, 'APPROVED')
})

test('bloqueia nova solicitacao depois do termino das entradas', async t => {
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.$transaction = originalTransaction
  })

  prisma.$transaction = async callback => callback({
    ranking: { findUnique: async () => closedEntriesBolao() },
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

test('bloqueia aprovacao pendente depois do termino das entradas', async t => {
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.$transaction = originalTransaction
  })

  prisma.$transaction = async callback => callback({
    ranking: {
      findUnique: async () => closedEntriesBolao(),
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

test('bloqueia a criacao de convite depois do termino das entradas', async t => {
  const originalFindUnique = prisma.ranking.findUnique
  const originalInviteCreate = prisma.bolaoInvite.create
  const originalAuditCreate = prisma.auditLog.create
  t.after(() => {
    prisma.ranking.findUnique = originalFindUnique
    prisma.bolaoInvite.create = originalInviteCreate
    prisma.auditLog.create = originalAuditCreate
  })

  prisma.ranking.findUnique = async () => closedEntriesBolao()
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

function closedEntriesBolao() {
  return {
    id: 'mesa-1',
    type: 'BOLAO',
    status: 'ACTIVE',
    entryFee: 0,
    maxParticipants: 50,
    currentParticipants: 1,
    createdByUserId: 'creator-1',
    startDate: new Date('2020-01-01T00:00:00Z'),
    entryEndDate: new Date('2020-06-01T00:00:00Z'),
  }
}

function openBolao() {
  return {
    id: 'mesa-1',
    type: 'BOLAO',
    status: 'ACTIVE',
    entryFee: 0,
    maxParticipants: null,
    currentParticipants: 500,
    createdByUserId: 'creator-1',
    startDate: new Date('2020-01-01T00:00:00Z'),
    entryEndDate: new Date('2099-08-02T00:00:00Z'),
  }
}
