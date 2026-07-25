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
