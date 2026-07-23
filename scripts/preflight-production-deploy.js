const { PrismaClient } = require('@prisma/client')

const requiredEnvironment = [
  'SESSION_SECRET',
  'MP_ACCESS_TOKEN',
  'MP_WEBHOOK_SECRET',
  'REDIS_URL',
]

const missingEnvironment = requiredEnvironment.filter(name => !process.env[name])
if (!process.env.CORS_ALLOWED_ORIGINS && !process.env.FRONTEND_ORIGIN) {
  missingEnvironment.push('CORS_ALLOWED_ORIGINS or FRONTEND_ORIGIN')
}

if (missingEnvironment.length > 0) {
  console.error(
    `Production configuration is missing: ${missingEnvironment.join(', ')}`
  )
  process.exit(1)
}

const prisma = new PrismaClient()

const invariantQueries = [
  [
    'wallets.balance < 0',
    'SELECT COUNT(*)::int AS count FROM "wallets" WHERE "balance" < 0',
  ],
  [
    'wallet_ledger.amount <= 0',
    'SELECT COUNT(*)::int AS count FROM "wallet_ledger" WHERE "amount" <= 0',
  ],
  [
    'round_benefits counters < 0',
    'SELECT COUNT(*)::int AS count FROM "round_benefits" WHERE "freeDoubles" < 0 OR "freeSuperDoubles" < 0',
  ],
  [
    'user_benefit_inventory.quantity < 0',
    'SELECT COUNT(*)::int AS count FROM "user_benefit_inventory" WHERE "quantity" < 0',
  ],
]

async function main() {
  const violations = []

  for (const [name, query] of invariantQueries) {
    const rows = await prisma.$queryRawUnsafe(query)
    const count = Number(rows[0]?.count ?? 0)
    console.log(`${name}: ${count}`)
    if (count > 0) violations.push(`${name} (${count})`)
  }

  if (violations.length > 0) {
    throw new Error(`Production invariant violations: ${violations.join(', ')}`)
  }

  console.log('Production configuration and data invariants passed.')
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
