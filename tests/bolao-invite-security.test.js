const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const { prisma } = require('../dist/lib/prisma')
const {
  JoinBolaoService,
} = require('../dist/services/bolao/join-bolao.service')
const {
  UseBolaoInviteService,
} = require('../dist/services/bolao/use-bolao-invite.service')
const {
  AssertActiveProUserService,
} = require('../dist/services/subscription/assert-active-pro-user.service')

function activeInvite(overrides = {}) {
  return {
    id: 'invite-1',
    rankingId: 'ranking-1',
    maxUses: 1,
    usedCount: 0,
    expiresAt: new Date(Date.now() + 60_000),
    isActive: true,
    ...overrides,
  }
}

test('reserva e entrada usam a mesma transação e não persistem o código no audit log', async t => {
  const originalTransaction = prisma.$transaction
  const originalJoin = JoinBolaoService.execute
  t.after(() => {
    prisma.$transaction = originalTransaction
    JoinBolaoService.execute = originalJoin
  })

  let auditData
  const tx = {
    bolaoInvite: { findUnique: async () => activeInvite() },
    rankingParticipant: { findUnique: async () => null },
    $queryRaw: async () => [{ usedCount: 1 }],
    auditLog: {
      create: async ({ data }) => {
        auditData = data
        return data
      },
    },
  }
  prisma.$transaction = async callback => callback(tx)
  JoinBolaoService.execute = async (input, transaction) => {
    assert.equal(transaction, tx)
    assert.deepEqual(input, { rankingId: 'ranking-1', userId: 'user-1' })
    return {
      status: 'APPROVED',
      rankingId: input.rankingId,
      participantId: 'participant-1',
    }
  }

  const result = await UseBolaoInviteService.execute({
    code: 'invite-code',
    userId: 'user-1',
  })

  assert.equal(result.idempotent, false)
  assert.equal(auditData.metadata.usedCountAfter, 1)
  assert.equal(auditData.metadata.inviteUseConsumed, true)
  assert.equal('code' in auditData.metadata, false)
})

test('repetição por participante aprovado é idempotente e não consome convite', async t => {
  const originalTransaction = prisma.$transaction
  const originalJoin = JoinBolaoService.execute
  t.after(() => {
    prisma.$transaction = originalTransaction
    JoinBolaoService.execute = originalJoin
  })

  let reservationCalled = false
  let joinCalled = false
  const tx = {
    bolaoInvite: {
      findUnique: async () => activeInvite({
        usedCount: 1,
        expiresAt: new Date(Date.now() - 60_000),
        isActive: false,
      }),
    },
    rankingParticipant: {
      findUnique: async () => ({
        id: 'participant-1',
        status: 'APPROVED',
        entryPaidAt: new Date(),
      }),
    },
    $queryRaw: async () => {
      reservationCalled = true
      return []
    },
    auditLog: { create: async () => ({}) },
  }
  prisma.$transaction = async callback => callback(tx)
  JoinBolaoService.execute = async () => {
    joinCalled = true
  }

  const result = await UseBolaoInviteService.execute({
    code: 'invite-code',
    userId: 'user-1',
  })

  assert.equal(result.idempotent, true)
  assert.equal(result.participantId, 'participant-1')
  assert.equal(reservationCalled, false)
  assert.equal(joinCalled, false)
})

test('convite não permite nova entrada FREE e reverte a reserva', async t => {
  const originalTransaction = prisma.$transaction
  const originalAssertPro = AssertActiveProUserService.execute
  t.after(() => {
    prisma.$transaction = originalTransaction
    AssertActiveProUserService.execute = originalAssertPro
  })

  AssertActiveProUserService.execute = async () => {
    const error = new Error(
      'Este recurso é exclusivo para usuários com assinatura PRO ativa.'
    )
    error.code = 'pro_subscription_required'
    error.statusCode = 403
    throw error
  }

  let usedCount = 0
  let participantCreated = false
  const tx = {
    bolaoInvite: { findUnique: async () => activeInvite({ usedCount }) },
    ranking: {
      findUnique: async () => ({
        id: 'ranking-1',
        type: 'BOLAO',
        status: 'ACTIVE',
        entryFee: 10,
        accessCost: 10,
        currentParticipants: 0,
        createdByUserId: 'creator-1',
        startDate: new Date('2020-01-01T00:00:00Z'),
        entryEndDate: new Date('2099-01-01T00:00:00Z'),
      }),
      update: async ({ data }) => data.grossCollected
        ? { grossCollected: 10 }
        : data,
    },
    rankingParticipant: {
      findUnique: async () => null,
      create: async ({ data }) => {
        participantCreated = true
        return { id: 'participant-1', ...data }
      },
    },
    wallet: {
      findUnique: async () => ({ id: 'wallet-1', balance: 20 }),
      updateMany: async () => ({ count: 1 }),
    },
    walletLedger: { create: async ({ data }) => data },
    user: { findUnique: async () => ({ scoreTotal: 0 }) },
    userScoreHistory: { findFirst: async () => null },
    auditLog: { create: async ({ data }) => data },
    $queryRaw: async () => {
      usedCount += 1
      return [{ usedCount }]
    },
  }
  prisma.$transaction = async callback => {
    const before = usedCount
    try {
      return await callback(tx)
    } catch (error) {
      usedCount = before
      throw error
    }
  }

  await assert.rejects(
    UseBolaoInviteService.execute({
      code: 'invite-code',
      userId: 'free-user',
    }),
    error => {
      assert.equal(error.code, 'pro_subscription_required')
      assert.equal(error.statusCode, 403)
      return true
    }
  )
  assert.equal(usedCount, 0)
  assert.equal(participantCreated, false)
})

test('reserva é compare-and-increment condicional no PostgreSQL', () => {
  const source = fs.readFileSync(
    path.resolve(
      __dirname,
      '../src/services/bolao/bolao-invite-reservation.ts'
    ),
    'utf8'
  )

  assert.match(source, /SET "usedCount" = "usedCount" \+ 1/)
  assert.match(source, /"usedCount" < "maxUses"/)
  assert.match(source, /"expiresAt" >/)
  assert.match(source, /RETURNING "usedCount"/)
})
