const assert = require('node:assert/strict')
const test = require('node:test')

const { prisma } = require('../dist/lib/prisma')
const {
  CreateBolaoService,
} = require('../dist/services/bolao/create-bolao.service')
const {
  ReviewBolaoRequestService,
} = require('../dist/services/bolao/review-bolao-request.service')
const {
  JoinBolaoService,
} = require('../dist/services/bolao/join-bolao.service')
const {
  AssertActiveProUserService,
} = require('../dist/services/subscription/assert-active-pro-user.service')

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
    description: 'Recompensa: 60/30/10 da recompensa líquida após taxa da plataforma.',
    startDate: new Date('2026-08-01T00:00:00Z'),
    entryEndDate: new Date('2026-08-15T00:00:00Z'),
    endDate: new Date('2026-08-31T23:59:59Z'),
    entryFee: 10,
    prizeDistribution: VALID_PRIZES,
    createdByUserId: 'creator-1',
    ...overrides,
  }
}

test('Mesa exige observacoes/regras da recompensa obrigatorias', async t => {
  const originalFindUnique = prisma.user.findUnique
  t.after(() => { prisma.user.findUnique = originalFindUnique })
  prisma.user.findUnique = async () => mockProUser()

  await assert.rejects(
    CreateBolaoService.execute(createInput({ description: '' })),
    (error) => {
      assert.equal(error.code, 'invalid_mesa_prize_rules')
      assert.match(error.message, /observações\/regras da recompensa/i)
      return true
    }
  )
  await assert.rejects(
    CreateBolaoService.execute(createInput({ description: '   ' })),
    (error) => {
      assert.equal(error.code, 'invalid_mesa_prize_rules')
      return true
    }
  )
  await assert.rejects(
    CreateBolaoService.execute(createInput({ description: 'curta' })),
    (error) => {
      assert.equal(error.code, 'invalid_mesa_prize_rules')
      assert.match(error.message, /pelo menos 10/)
      return true
    }
  )
  await assert.rejects(
    CreateBolaoService.execute(createInput({ description: 'x'.repeat(501) })),
    (error) => {
      assert.equal(error.code, 'invalid_mesa_prize_rules')
      assert.match(error.message, /no máximo 500/)
      return true
    }
  )
})

test('Mesa exige abertura anterior ao termino das entradas e ao fim', async t => {
  const originalFindUnique = prisma.user.findUnique
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.user.findUnique = originalFindUnique
    prisma.$transaction = originalTransaction
  })
  prisma.user.findUnique = async () => mockProUser()
  prisma.$transaction = async () => {
    throw new Error('A transação não deve iniciar com datas inválidas')
  }

  await assert.rejects(
    CreateBolaoService.execute(createInput({
      entryEndDate: new Date('invalid'),
    })),
    { message: 'Informe uma data válida para o término dos acessos' }
  )

  await assert.rejects(
    CreateBolaoService.execute(createInput({
      entryEndDate: new Date('2026-08-01T00:00:00Z'),
    })),
    { message: 'A data de término dos acessos deve ser posterior à data de início' }
  )

  await assert.rejects(
    CreateBolaoService.execute(createInput({
      entryEndDate: new Date('2026-09-01T00:00:00Z'),
    })),
    { message: 'A data de término dos acessos deve ser anterior ou igual à data de fim da Mesa' }
  )
})

test('Mesa exige acesso positivo e uma distribuicao que some 100%', async t => {
  const originalFindUnique = prisma.user.findUnique
  t.after(() => { prisma.user.findUnique = originalFindUnique })
  prisma.user.findUnique = async () => mockProUser()

  await assert.rejects(
    CreateBolaoService.execute(createInput({ entryFee: 0 })),
    { message: 'O acesso em tampinhas deve ser maior que zero' }
  )
  await assert.rejects(
    CreateBolaoService.execute(createInput({ prizeDistribution: [] })),
    { message: 'Informe ao menos uma faixa de recompensa' }
  )
  await assert.rejects(
    CreateBolaoService.execute(createInput({
      prizeDistribution: [
        { position: 1, percentage: 70 },
        { position: 2, percentage: 20 },
      ],
    })),
    { message: 'Os percentuais de recompensa devem somar 100%' }
  )
  await assert.rejects(
    CreateBolaoService.execute(createInput({
      prizeDistribution: [
        { position: 1, percentage: 70 },
        { position: 3, percentage: 30 },
      ],
    })),
    { message: 'As posições com recompensa devem ser sequenciais a partir da 1ª posição' }
  )
})

test('admin cria Mesa vazia sem debitar fichas do criador', async t => {
  const originalFindUnique = prisma.user.findUnique
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.user.findUnique = originalFindUnique
    prisma.$transaction = originalTransaction
  })
  prisma.user.findUnique = async () => ({ id: 'creator-1' })

  let rankingData
  let walletTouched = false
  prisma.$transaction = async callback => callback({
    ranking: {
      create: async ({ data }) => {
        rankingData = data
        return { ...data }
      },
    },
    rankingParticipant: {
      create: async () => {
        throw new Error('nao deve auto-inscrever o admin')
      },
    },
    wallet: {
      findUnique: async () => {
        walletTouched = true
        return { id: 'wallet-1', balance: 25 }
      },
      updateMany: async () => {
        walletTouched = true
        return { count: 1 }
      },
    },
    walletLedger: {
      create: async () => {
        walletTouched = true
        return {}
      },
    },
    auditLog: { create: async () => ({}) },
  })

  const result = await CreateBolaoService.execute(createInput({
    accessCost: 10,
    entryFee: undefined,
  }))

  assert.deepEqual(rankingData.prizeDistribution, VALID_PRIZES)
  assert.equal(rankingData.entryFee, 10)
  assert.equal(rankingData.grossCollected, 0)
  assert.equal(rankingData.currentParticipants, 0)
  assert.equal(result.accessCost, 10)
  assert.equal(result.entryFee, 10)
  assert.equal(result.rewardPool, 0)
  assert.equal(result.prizePool, 0)
  assert.equal(walletTouched, false)
})

test('acesso à Mesa é imediato e depende somente do saldo de tampinhas', async t => {
  const originalAssertPro = AssertActiveProUserService.execute
  const originalTransaction = prisma.$transaction
  t.after(() => {
    AssertActiveProUserService.execute = originalAssertPro
    prisma.$transaction = originalTransaction
  })

  AssertActiveProUserService.execute = async () => {
    throw new Error('entrada não deve exigir assinatura PRO')
  }

  let participantData
  let ledgerData
  const rankingUpdates = []
  prisma.$transaction = async callback => callback({
    ranking: {
      findUnique: async () => ({
        id: 'mesa-1', type: 'BOLAO', status: 'ACTIVE', entryFee: 11,
        currentParticipants: 1, createdByUserId: 'creator-1',
        startDate: new Date('2020-01-01T00:00:00Z'),
        entryEndDate: new Date('2099-08-02T00:00:00Z'),
      }),
      update: async ({ data }) => {
        rankingUpdates.push(data)
        return data.grossCollected ? { grossCollected: 22 } : data
      },
    },
    rankingParticipant: {
      findUnique: async () => null,
      create: async ({ data }) => {
        participantData = data
        return { id: 'participant-2', ...data }
      },
    },
    wallet: {
      findUnique: async () => ({ id: 'wallet-2', balance: 20 }),
      updateMany: async () => ({ count: 1 }),
    },
    walletLedger: {
      create: async ({ data }) => {
        ledgerData = data
        return data
      },
    },
    user: { findUnique: async () => ({ scoreTotal: 5 }) },
    userScoreHistory: { findFirst: async () => null },
    auditLog: { create: async () => ({}) },
  })

  const result = await JoinBolaoService.execute({
    rankingId: 'mesa-1',
    userId: 'user-2',
  })

  assert.equal(result.status, 'APPROVED')
  assert.equal(participantData.status, 'APPROVED')
  assert.equal(participantData.entryFeePaid, 11)
  assert.ok(participantData.entryPaidAt instanceof Date)
  assert.equal(ledgerData.idempotencyKey, 'bolao:entry:mesa-1:user-2')
  assert.deepEqual(rankingUpdates[0].grossCollected, { increment: 11 })
  assert.equal(rankingUpdates[1].platformFee, 2)
  assert.equal(rankingUpdates[1].prizePool, 20)
})

test('entrada sem fichas não cria participante nem altera o caixa da Mesa', async t => {
  const originalTransaction = prisma.$transaction
  t.after(() => { prisma.$transaction = originalTransaction })

  let participantChanged = false
  let rankingChanged = false
  prisma.$transaction = async callback => callback({
    ranking: {
      findUnique: async () => ({
        id: 'mesa-1', type: 'BOLAO', status: 'ACTIVE', entryFee: 11,
        currentParticipants: 1, createdByUserId: 'creator-1',
        startDate: new Date('2020-01-01T00:00:00Z'),
        entryEndDate: new Date('2099-08-02T00:00:00Z'),
      }),
      update: async () => { rankingChanged = true },
    },
    rankingParticipant: {
      findUnique: async () => null,
      create: async () => { participantChanged = true },
    },
    wallet: {
      findUnique: async () => ({ id: 'wallet-2', balance: 5 }),
      updateMany: async () => ({ count: 0 }),
    },
    user: { findUnique: async () => ({ scoreTotal: 5 }) },
    userScoreHistory: { findFirst: async () => null },
  })

  await assert.rejects(
    JoinBolaoService.execute({ rankingId: 'mesa-1', userId: 'user-2' }),
    { message: 'Participante não possui tampinhas suficientes para acessar esta Mesa' }
  )
  assert.equal(participantChanged, false)
  assert.equal(rankingChanged, false)
})

test('aprovação debita uma única vez e atualiza o caixa financeiro', async t => {
  const originalTransaction = prisma.$transaction
  t.after(() => { prisma.$transaction = originalTransaction })

  let participantUpdate
  const rankingUpdates = []
  let debitCalls = 0
  let ledgerData
  prisma.$transaction = async callback => callback({
    ranking: {
      findUnique: async () => ({
        id: 'mesa-1', type: 'BOLAO', status: 'ACTIVE', entryFee: 11,
        maxParticipants: 50, currentParticipants: 1, createdByUserId: 'creator-1',
      }),
      update: async ({ data }) => {
        rankingUpdates.push(data)
        return data.grossCollected
          ? { grossCollected: 22 }
          : data
      },
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
  assert.deepEqual(rankingUpdates[0].grossCollected, { increment: 11 })
  assert.equal(rankingUpdates[1].platformFee, 2)
  assert.equal(rankingUpdates[1].prizePool, 20)
})

test('aprovação sem saldo não altera participante nem caixa', async t => {
  const originalTransaction = prisma.$transaction
  t.after(() => { prisma.$transaction = originalTransaction })

  let participantChanged = false
  let rankingChanged = false
  prisma.$transaction = async callback => callback({
    ranking: {
      findUnique: async () => ({
        id: 'mesa-1', type: 'BOLAO', status: 'ACTIVE', entryFee: 11,
        maxParticipants: 50, currentParticipants: 1, createdByUserId: 'creator-1',
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
    { message: 'Participante não possui tampinhas suficientes para acessar esta Mesa' }
  )
  assert.equal(participantChanged, false)
  assert.equal(rankingChanged, false)
})
