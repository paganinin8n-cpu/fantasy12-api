const assert = require('node:assert/strict')
const test = require('node:test')

const { prisma } = require('../dist/lib/prisma')
const {
  CreateBolaoService,
} = require('../dist/services/bolao/create-bolao.service')
const {
  ReviewBolaoRequestService,
} = require('../dist/services/bolao/review-bolao-request.service')

const VALID_PRIZES = [
  { position: 1, percentage: 60 },
  { position: 2, percentage: 30 },
  { position: 3, percentage: 10 },
]

function mockProUser() {
  return {
    id: 'creator-1',
    subscription: {
      status: 'ACTIVE',
      plan: 'MONTHLY',
      endAt: new Date('2027-01-01T00:00:00Z'),
    },
  }
}

function createInput(overrides = {}) {
  return {
    name: 'Mesa Financeira',
    startDate: new Date('2026-08-01T00:00:00Z'),
    endDate: new Date('2026-08-31T23:59:59Z'),
    entryFee: 10,
    prizeDistribution: VALID_PRIZES,
    createdByUserId: 'creator-1',
    ...overrides,
  }
}

test('Mesa exige entrada positiva e uma distribuicao que some 100%', async t => {
  const originalFindUnique = prisma.user.findUnique
  t.after(() => { prisma.user.findUnique = originalFindUnique })
  prisma.user.findUnique = async () => mockProUser()

  await assert.rejects(
    CreateBolaoService.execute(createInput({ entryFee: 0 })),
    { message: 'A entrada em fichas deve ser maior que zero' }
  )
  await assert.rejects(
    CreateBolaoService.execute(createInput({ prizeDistribution: [] })),
    { message: 'Informe ao menos uma faixa de premiação' }
  )
  await assert.rejects(
    CreateBolaoService.execute(createInput({
      prizeDistribution: [
        { position: 1, percentage: 70 },
        { position: 2, percentage: 20 },
      ],
    })),
    { message: 'Os percentuais de premiação devem somar 100%' }
  )
  await assert.rejects(
    CreateBolaoService.execute(createInput({
      prizeDistribution: [
        { position: 1, percentage: 70 },
        { position: 3, percentage: 30 },
      ],
    })),
    { message: 'As posições premiadas devem ser sequenciais a partir da 1ª posição' }
  )
})

test('criador paga a entrada atomicamente e inaugura o caixa da Mesa', async t => {
  const originalFindUnique = prisma.user.findUnique
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.user.findUnique = originalFindUnique
    prisma.$transaction = originalTransaction
  })
  prisma.user.findUnique = async () => mockProUser()

  let rankingData
  let participantData
  let debitData
  let ledgerData
  prisma.$transaction = async callback => callback({
    ranking: {
      create: async ({ data }) => {
        rankingData = data
        return { ...data }
      },
      update: async ({ data }) => ({
        id: 'mesa-1', name: 'Mesa Financeira', status: 'DRAFT', entryFee: 10,
        maxParticipants: 50, startDate: createInput().startDate,
        endDate: createInput().endDate, ...data,
      }),
    },
    round: { findFirst: async () => ({ id: 'round-1', closeAt: new Date('2026-08-02') }) },
    rankingRound: { create: async () => ({}) },
    rankingParticipant: { create: async ({ data }) => { participantData = data; return data } },
    user: { findUnique: async () => ({ scoreTotal: 0 }) },
    userScoreHistory: { findFirst: async () => null },
    wallet: {
      findUnique: async () => ({ id: 'wallet-1', balance: 25 }),
      updateMany: async ({ data }) => { debitData = data; return { count: 1 } },
    },
    walletLedger: { create: async ({ data }) => { ledgerData = data; return data } },
    auditLog: { create: async () => ({}) },
  })

  await CreateBolaoService.execute(createInput())

  assert.deepEqual(rankingData.prizeDistribution, VALID_PRIZES)
  assert.deepEqual(debitData, { balance: { decrement: 10 } })
  assert.equal(ledgerData.type, 'DEBIT')
  assert.equal(ledgerData.amount, 10)
  assert.equal(ledgerData.idempotencyKey, `bolao:entry:${rankingData.id}:creator-1`)
  assert.equal(participantData.entryFeePaid, 10)
  assert.ok(participantData.entryPaidAt instanceof Date)
  assert.equal(rankingData.grossCollected, 10)
})

test('aprovação debita uma única vez e atualiza o caixa financeiro', async t => {
  const originalTransaction = prisma.$transaction
  t.after(() => { prisma.$transaction = originalTransaction })

  let participantUpdate
  let rankingUpdate
  let debitCalls = 0
  let ledgerData
  prisma.$transaction = async callback => callback({
    ranking: {
      findUnique: async () => ({
        id: 'mesa-1', type: 'BOLAO', status: 'DRAFT', entryFee: 11,
        maxParticipants: 50, currentParticipants: 1, createdByUserId: 'creator-1',
        rounds: [{ round: { closeAt: new Date('2026-08-02'), status: 'OPEN' } }],
      }),
      update: async ({ data }) => { rankingUpdate = data; return data },
    },
    rankingParticipant: {
      findUnique: async () => ({
        id: 'participant-2', rankingId: 'mesa-1', userId: 'user-2',
        status: 'PENDING', entryPaidAt: null,
      }),
      update: async ({ data }) => { participantUpdate = data; return data },
    },
    wallet: {
      findUnique: async () => ({ id: 'wallet-2', balance: 20 }),
      updateMany: async () => { debitCalls += 1; return { count: 1 } },
    },
    walletLedger: { create: async ({ data }) => { ledgerData = data; return data } },
    user: { findUnique: async () => ({ scoreTotal: 5 }) },
    userScoreHistory: { findFirst: async () => null },
    auditLog: { create: async () => ({}) },
  })

  await ReviewBolaoRequestService.execute({
    rankingId: 'mesa-1', participantId: 'participant-2',
    reviewerUserId: 'creator-1', status: 'APPROVED',
  })

  assert.equal(debitCalls, 1)
  assert.equal(ledgerData.idempotencyKey, 'bolao:entry:mesa-1:user-2')
  assert.equal(participantUpdate.entryFeePaid, 11)
  assert.ok(participantUpdate.entryPaidAt instanceof Date)
  assert.deepEqual(rankingUpdate.grossCollected, { increment: 11 })
})

test('aprovação sem saldo não altera participante nem caixa', async t => {
  const originalTransaction = prisma.$transaction
  t.after(() => { prisma.$transaction = originalTransaction })

  let participantChanged = false
  let rankingChanged = false
  prisma.$transaction = async callback => callback({
    ranking: {
      findUnique: async () => ({
        id: 'mesa-1', type: 'BOLAO', status: 'DRAFT', entryFee: 11,
        maxParticipants: 50, currentParticipants: 1, createdByUserId: 'creator-1',
        rounds: [{ round: { closeAt: new Date('2026-08-02'), status: 'OPEN' } }],
      }),
      update: async () => { rankingChanged = true },
    },
    rankingParticipant: {
      findUnique: async () => ({
        id: 'participant-2', rankingId: 'mesa-1', userId: 'user-2', status: 'PENDING',
      }),
      update: async () => { participantChanged = true },
    },
    wallet: {
      findUnique: async () => ({ id: 'wallet-2', balance: 5 }),
      updateMany: async () => ({ count: 0 }),
    },
  })

  await assert.rejects(
    ReviewBolaoRequestService.execute({
      rankingId: 'mesa-1', participantId: 'participant-2',
      reviewerUserId: 'creator-1', status: 'APPROVED',
    }),
    { message: 'Participante não possui fichas suficientes para entrar nesta Mesa' }
  )
  assert.equal(participantChanged, false)
  assert.equal(rankingChanged, false)
})
