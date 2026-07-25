#!/usr/bin/env node

const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { PrismaClient } = require('@prisma/client')
const {
  reserveBolaoInviteUse,
} = require('../dist/services/bolao/bolao-invite-reservation')

const prisma = new PrismaClient()

async function main() {
  const suffix = randomUUID()
  const userId = randomUUID()
  const rankingId = randomUUID()
  const limitedInviteId = randomUUID()
  const rollbackInviteId = randomUUID()

  try {
    await prisma.user.create({
      data: {
        id: userId,
        name: 'SEC-008 integration test',
        email: `sec-008-${suffix}@example.invalid`,
        password: 'integration-test-not-a-real-password',
      },
    })
    await prisma.ranking.create({
      data: {
        id: rankingId,
        name: `SEC-008-${suffix}`,
        type: 'BOLAO',
        status: 'ACTIVE',
        createdByUserId: userId,
      },
    })
    await prisma.bolaoInvite.createMany({
      data: [
        {
          id: limitedInviteId,
          rankingId,
          code: randomUUID(),
          maxUses: 1,
          createdByUserId: userId,
        },
        {
          id: rollbackInviteId,
          rankingId,
          code: randomUUID(),
          maxUses: 1,
          createdByUserId: userId,
        },
      ],
    })

    const attempts = await Promise.all(
      Array.from({ length: 12 }, () =>
        prisma.$transaction(tx =>
          reserveBolaoInviteUse(tx, limitedInviteId, new Date())
        )
      )
    )
    assert.equal(attempts.filter(Boolean).length, 1)

    const limited = await prisma.bolaoInvite.findUniqueOrThrow({
      where: { id: limitedInviteId },
    })
    assert.equal(limited.usedCount, 1)

    await assert.rejects(
      prisma.$transaction(async tx => {
        const reservation = await reserveBolaoInviteUse(
          tx,
          rollbackInviteId,
          new Date()
        )
        assert.ok(reservation)
        throw new Error('simulate join failure')
      }),
      /simulate join failure/
    )

    const rolledBack = await prisma.bolaoInvite.findUniqueOrThrow({
      where: { id: rollbackInviteId },
    })
    assert.equal(rolledBack.usedCount, 0)

    console.log('SEC-008 PostgreSQL concurrency test passed.')
  } finally {
    await prisma.ranking.deleteMany({ where: { id: rankingId } })
    await prisma.user.deleteMany({ where: { id: userId } })
    await prisma.$disconnect()
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
