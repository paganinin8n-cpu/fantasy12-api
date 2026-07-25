const { randomUUID } = require('node:crypto')
const Redis = require('ioredis')
const { prisma } = require('../dist/lib/prisma')

function argument(name) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const userId = argument('user-id')
const requestId = argument('request-id')
const adminId = argument('admin-id')
const reason = argument('reason')
const execute = process.argv.includes('--execute-ephemeral-cleanup')

function requireInputs() {
  for (const [name, value] of Object.entries({
    'user-id': userId,
    'request-id': requestId,
    'admin-id': adminId,
    reason,
  })) {
    if (!value) throw new Error(`--${name} is required`)
  }
}

async function inventory() {
  const [user, resetTokens, payments, auditLogs] = await Promise.all([
    prisma.user.count({ where: { id: userId } }),
    prisma.passwordResetToken.count({ where: { userId } }),
    prisma.payment.count({ where: { userId } }),
    prisma.auditLog.count({ where: { userId } }),
  ])
  return { user, resetTokens, payments, auditLogs }
}

async function revokeRedisSessions() {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is required when cleanup is executed')
  }
  const redis = new Redis(process.env.REDIS_URL, {
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
  })
  try {
    const indexKey = `f12:user-sessions:${userId}`
    const sessionIds = await redis.smembers(indexKey)
    if (sessionIds.length > 0) {
      await redis.del(...sessionIds.map(id => `f12:session:${id}`))
    }
    await redis.del(indexKey)
    return sessionIds.length
  } finally {
    await redis.quit().catch(() => redis.disconnect())
  }
}

async function main() {
  requireInputs()
  const before = await inventory()
  if (before.user !== 1) throw new Error('User not found')

  if (!execute) {
    console.log(JSON.stringify({ mode: 'dry-run', requestId, counts: before }))
    return
  }

  const auditId = randomUUID()
  const deletedTokens = await prisma.$transaction(async tx => {
    const deleted = await tx.passwordResetToken.deleteMany({ where: { userId } })
    await tx.user.update({
      where: { id: userId },
      data: { sessionVersion: { increment: 1 } },
    })
    await tx.adminAuditLog.create({
      data: {
        id: auditId,
        adminId,
        action: 'PRIVACY_EPHEMERAL_DATA_CLEANED',
        entity: 'USER',
        entityId: userId,
        payload: { requestId, reason, deletedResetTokenCount: deleted.count },
      },
    })
    return deleted.count
  })
  const revokedSessions = await revokeRedisSessions()
  console.log(
    JSON.stringify({
      mode: 'executed',
      requestId,
      auditId,
      deletedTokens,
      revokedSessions,
      counts: await inventory(),
    })
  )
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : 'Privacy request failed')
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
