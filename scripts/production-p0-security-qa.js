const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const bcrypt = require('bcryptjs')
const Redis = require('ioredis')

const { prisma } = require('../dist/lib/prisma')
const { WalletService } = require('../dist/services/wallet/wallet.service')
const {
  AdminWalletCreditService,
} = require('../dist/services/admin/admin-wallet-credit.service')
const {
  ConsumeBenefitsService,
} = require('../dist/services/benefits/consume-benefits.service')

const runId = String(process.env.P0_QA_RUN_ID || '').replace(/[^0-9]/g, '')
const apiUrl = (process.env.P0_QA_API_URL || 'https://api.fantasy12.com')
  .replace(/\/$/, '')
const allowedOrigins = String(
  process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN || ''
)
  .split(',')
  .map(value => value.trim())
  .filter(Boolean)
const officialOrigin = allowedOrigins[0]
const qaEmail = `qa-p0-${runId}@example.invalid`
const qaPassword = `P0!${crypto.randomBytes(18).toString('hex')}`
const walletDebitDescription = `P0 QA wallet concurrency ${runId}`
const adminDebitReason = `P0 QA admin concurrency ${runId}`

function requireQaEnvironment() {
  assert.equal(
    process.env.P0_QA_CONFIRMATION,
    'RUN_P0_SECURITY_QA',
    'P0 QA confirmation is missing'
  )
  assert.match(runId, /^\d+$/, 'P0 QA run ID is invalid')
  assert.equal(process.env.NODE_ENV, 'production', 'P0 QA must run in production')
  assert.ok(process.env.REDIS_URL, 'REDIS_URL is required')
  assert.ok(process.env.MP_ACCESS_TOKEN, 'MP_ACCESS_TOKEN is required')
  assert.ok(process.env.MP_WEBHOOK_SECRET, 'MP_WEBHOOK_SECRET is required')
  assert.notEqual(
    process.env.MP_ALLOW_UNSIGNED_TEST_WEBHOOKS,
    'true',
    'Unsigned Mercado Pago webhooks cannot be enabled in production'
  )
  assert.ok(officialOrigin, 'An official frontend origin is required')
}

async function deleteRedisSessions(redis, userId) {
  const indexKey = `f12:user-sessions:${userId}`
  const sessionIds = await redis.smembers(indexKey)
  if (sessionIds.length > 0) {
    await redis.del(...sessionIds.map(id => `f12:session:${id}`))
  }
  await redis.del(indexKey)
}

async function cleanupQaUser() {
  const users = await prisma.user.findMany({
    where: { email: qaEmail },
    select: { id: true },
  })
  if (users.length === 0) return

  const userIds = users.map(user => user.id)
  const redis = new Redis(process.env.REDIS_URL, {
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
  })

  try {
    for (const userId of userIds) {
      await deleteRedisSessions(redis, userId)
    }
  } finally {
    await redis.quit().catch(() => redis.disconnect())
  }

  await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
}

async function createQaUser() {
  const password = await bcrypt.hash(qaPassword, 10)
  return prisma.user.create({
    data: {
      name: 'P0 Security QA',
      nickname: `p0qa${runId}`.slice(0, 40),
      email: qaEmail,
      cpf: `8${runId.padStart(10, '0').slice(-10)}`,
      phone: '5599999999999',
      password,
      role: 'NORMAL',
    },
  })
}

function assertOneSuccessOneRejection(results, label) {
  const fulfilled = results.filter(result => result.status === 'fulfilled')
  const rejected = results.filter(result => result.status === 'rejected')
  assert.equal(fulfilled.length, 1, `${label} must have exactly one success`)
  assert.equal(rejected.length, 1, `${label} must have exactly one rejection`)
}

async function assertConstraintBlocks(operation, label) {
  let blocked = false
  try {
    await operation()
  } catch {
    blocked = true
  }
  assert.equal(blocked, true, `${label} constraint did not block invalid SQL`)
}

async function verifySec001(user) {
  console.log('P0 QA phase: SEC-001 migration and constraints')

  const migrations = await prisma.$queryRawUnsafe(`
    SELECT "finished_at", "rolled_back_at"
    FROM "_prisma_migrations"
    WHERE "migration_name" = '20260722220000_enforce_non_negative_balances'
  `)
  assert.equal(migrations.length, 1, 'SEC-001 migration is not registered')
  assert.ok(migrations[0].finished_at, 'SEC-001 migration is not finished')
  assert.equal(migrations[0].rolled_back_at, null, 'SEC-001 migration was rolled back')

  const requiredConstraints = [
    'wallets_balance_non_negative',
    'wallet_ledger_amount_positive',
    'round_benefits_free_doubles_non_negative',
    'round_benefits_free_super_doubles_non_negative',
    'user_benefit_inventory_quantity_non_negative',
  ]
  const constraints = await prisma.$queryRawUnsafe(`
    SELECT "conname", "convalidated"
    FROM "pg_constraint"
    WHERE "conname" IN (
      'wallets_balance_non_negative',
      'wallet_ledger_amount_positive',
      'round_benefits_free_doubles_non_negative',
      'round_benefits_free_super_doubles_non_negative',
      'user_benefit_inventory_quantity_non_negative'
    )
  `)
  const validated = new Map(
    constraints.map(constraint => [constraint.conname, constraint.convalidated])
  )
  for (const name of requiredConstraints) {
    assert.equal(validated.get(name), true, `${name} is missing or not validated`)
  }

  console.log('P0 QA phase: SEC-001 concurrent wallet debit')
  const wallet = await prisma.wallet.create({
    data: { userId: user.id, balance: 10 },
  })
  const walletResults = await Promise.allSettled([
    WalletService.debit(user.id, 10, walletDebitDescription),
    WalletService.debit(user.id, 10, walletDebitDescription),
  ])
  assertOneSuccessOneRejection(walletResults, 'wallet debit race')

  const walletAfter = await prisma.wallet.findUnique({ where: { id: wallet.id } })
  const walletLedgerCount = await prisma.walletLedger.count({
    where: {
      walletId: wallet.id,
      type: 'DEBIT',
      description: walletDebitDescription,
    },
  })
  assert.equal(walletAfter.balance, 0, 'wallet balance must finish at zero')
  assert.equal(walletLedgerCount, 1, 'wallet race must create one debit ledger')
  await assertConstraintBlocks(
    () =>
      prisma.$executeRawUnsafe(
        'UPDATE "wallets" SET "balance" = -1 WHERE "id" = $1',
        wallet.id
      ),
    'wallet non-negative'
  )

  console.log('P0 QA phase: SEC-001 concurrent administrative debit')
  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { balance: 10 },
  })
  const adminResults = await Promise.allSettled([
    AdminWalletCreditService.debit(
      user.id,
      user.id,
      10,
      adminDebitReason
    ),
    AdminWalletCreditService.debit(
      user.id,
      user.id,
      10,
      adminDebitReason
    ),
  ])
  assertOneSuccessOneRejection(adminResults, 'administrative wallet debit race')

  const adminWalletAfter = await prisma.wallet.findUnique({
    where: { id: wallet.id },
  })
  const adminLedgerCount = await prisma.walletLedger.count({
    where: {
      walletId: wallet.id,
      type: 'DEBIT',
      description: `ADMIN DEBIT: ${adminDebitReason}`,
    },
  })
  const adminAuditCount = await prisma.auditLog.count({
    where: {
      userId: user.id,
      action: 'ADMIN_WALLET_DEBIT',
      entityId: wallet.id,
    },
  })
  assert.equal(adminWalletAfter.balance, 0, 'admin debit must finish at zero')
  assert.equal(adminLedgerCount, 1, 'admin race must create one debit ledger')
  assert.equal(adminAuditCount, 1, 'admin race must create one audit record')

  console.log('P0 QA phase: SEC-001 concurrent benefit consumption')
  const inventory = await prisma.userBenefitInventory.create({
    data: { userId: user.id, type: 'DOUBLE', quantity: 1 },
  })
  const inventoryResults = await Promise.allSettled([
    ConsumeBenefitsService.execute({
      userId: user.id,
      roundId: crypto.randomUUID(),
      type: 'DOUBLE',
      quantity: 1,
    }),
    ConsumeBenefitsService.execute({
      userId: user.id,
      roundId: crypto.randomUUID(),
      type: 'DOUBLE',
      quantity: 1,
    }),
  ])
  assertOneSuccessOneRejection(inventoryResults, 'benefit consumption race')

  const inventoryAfter = await prisma.userBenefitInventory.findUnique({
    where: { id: inventory.id },
  })
  assert.equal(inventoryAfter.quantity, 0, 'benefit inventory must finish at zero')
  await assertConstraintBlocks(
    () =>
      prisma.$executeRawUnsafe(
        'UPDATE "user_benefit_inventory" SET "quantity" = -1 WHERE "id" = $1',
        inventory.id
      ),
    'benefit inventory non-negative'
  )

  console.log('SEC-001 production PostgreSQL QA passed')
}

async function jsonRequest(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, options)
  const text = await response.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { response, body }
}

async function login() {
  const { response, body } = await jsonRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: qaEmail, password: qaPassword }),
  })
  assert.equal(response.status, 200, `login failed with HTTP ${response.status}`)
  const setCookie = response.headers.get('set-cookie')
  assert.ok(setCookie, 'login did not return a session cookie')
  return {
    cookie: setCookie.split(';', 1)[0],
    user: body.user,
  }
}

async function verifySec002(user) {
  console.log('P0 QA phase: SEC-002 official frontend preflight')
  const preflight = await fetch(`${apiUrl}/api/me`, {
    method: 'OPTIONS',
    headers: {
      origin: officialOrigin,
      'access-control-request-method': 'PATCH',
      'access-control-request-headers': 'content-type',
    },
  })
  assert.equal(preflight.status, 204, 'official frontend preflight must pass')
  assert.equal(
    preflight.headers.get('access-control-allow-origin'),
    officialOrigin,
    'official frontend origin is missing from CORS response'
  )
  assert.equal(
    preflight.headers.get('access-control-allow-credentials'),
    'true',
    'credentialed CORS is not enabled'
  )

  console.log('P0 QA phase: SEC-002 normal-user mutations')
  const normalLogin = await login()
  assert.equal(normalLogin.user.role, 'NORMAL', 'normal-user login role mismatch')

  const valid = await jsonRequest('/api/me', {
    method: 'PATCH',
    headers: {
      cookie: normalLogin.cookie,
      origin: officialOrigin,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ bio: 'SEC-002 official origin QA' }),
  })
  assert.equal(valid.response.status, 200, 'official-origin mutation must pass')

  const invalidOrigin = await jsonRequest('/api/me', {
    method: 'PATCH',
    headers: {
      cookie: normalLogin.cookie,
      origin: 'https://csrf-attacker.example',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ bio: 'must not be applied' }),
  })
  assert.equal(invalidOrigin.response.status, 403, 'cross-site mutation must fail')
  assert.equal(invalidOrigin.body.error, 'csrf_origin_rejected')

  const missingOrigin = await jsonRequest('/api/me', {
    method: 'PATCH',
    headers: {
      cookie: normalLogin.cookie,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ bio: 'must not be applied' }),
  })
  assert.equal(missingOrigin.response.status, 403, 'origin-less mutation must fail')

  const unsafeContentType = await jsonRequest('/api/me', {
    method: 'PATCH',
    headers: {
      cookie: normalLogin.cookie,
      origin: officialOrigin,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: 'bio=must-not-be-applied',
  })
  assert.equal(
    unsafeContentType.response.status,
    415,
    'non-JSON authenticated mutation must fail'
  )
  assert.equal(unsafeContentType.body.error, 'json_content_type_required')

  const refererFallback = await jsonRequest('/api/me', {
    method: 'PATCH',
    headers: {
      cookie: normalLogin.cookie,
      referer: `${officialOrigin}/dashboard`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ bio: 'SEC-002 referer fallback QA' }),
  })
  assert.equal(refererFallback.response.status, 200, 'official referer must pass')

  const logout = await jsonRequest('/api/auth/logout', {
    method: 'POST',
    headers: {
      cookie: normalLogin.cookie,
      origin: officialOrigin,
      'content-type': 'application/json',
    },
    body: '{}',
  })
  assert.equal(logout.response.status, 200, 'normal-user logout failed')

  console.log('P0 QA phase: SEC-002 administrator mutations')
  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' },
  })
  const adminLogin = await login()
  assert.equal(adminLogin.user.role, 'ADMIN', 'administrator login role mismatch')

  const adminInvalid = await jsonRequest('/api/me', {
    method: 'PATCH',
    headers: {
      cookie: adminLogin.cookie,
      origin: 'https://csrf-attacker.example',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ bio: 'must not be applied' }),
  })
  assert.equal(adminInvalid.response.status, 403, 'admin cross-site mutation must fail')

  const adminValid = await jsonRequest('/api/me', {
    method: 'PATCH',
    headers: {
      cookie: adminLogin.cookie,
      origin: officialOrigin,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ bio: 'SEC-002 administrator QA' }),
  })
  assert.equal(adminValid.response.status, 200, 'admin official mutation must pass')

  console.log('SEC-002 production frontend-origin QA passed')
}

function mercadoPagoSignature(secret, dataId, requestId, timestamp) {
  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`
  return crypto.createHmac('sha256', secret).update(manifest).digest('hex')
}

async function webhookRequest({
  dataId,
  requestId,
  timestamp,
  signature,
  bodyId,
}) {
  return jsonRequest(
    `/internal/webhooks/mercado-pago?data.id=${encodeURIComponent(dataId)}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(requestId ? { 'x-request-id': requestId } : {}),
        ...(timestamp && signature
          ? { 'x-signature': `ts=${timestamp},v1=${signature}` }
          : {}),
      },
      body: JSON.stringify({
        id: bodyId || `p0-security-${runId}`,
        type: 'security.qa',
        data: { id: dataId },
      }),
    }
  )
}

async function verifySec004() {
  console.log('P0 QA phase: SEC-004 production webhook authenticity')
  const dataId = runId.slice(-18)
  const timestamp = String(Math.floor(Date.now() / 1000))
  const primaryRequestId = `p0-sec004-${runId}-primary`
  const primarySignature = mercadoPagoSignature(
    process.env.MP_WEBHOOK_SECRET,
    dataId,
    primaryRequestId,
    timestamp
  )
  const validPrimary = await webhookRequest({
    dataId,
    requestId: primaryRequestId,
    timestamp,
    signature: primarySignature,
  })
  assert.equal(
    validPrimary.response.status,
    200,
    'valid primary webhook signature must pass'
  )
  assert.equal(validPrimary.body.received, true)

  if (process.env.MP_TEST_WEBHOOK_SECRET) {
    const secondaryRequestId = `p0-sec004-${runId}-secondary`
    const secondarySignature = mercadoPagoSignature(
      process.env.MP_TEST_WEBHOOK_SECRET,
      dataId,
      secondaryRequestId,
      timestamp
    )
    const validSecondary = await webhookRequest({
      dataId,
      requestId: secondaryRequestId,
      timestamp,
      signature: secondarySignature,
      bodyId: `p0-security-secondary-${runId}`,
    })
    assert.equal(
      validSecondary.response.status,
      200,
      'valid secondary webhook signature must pass'
    )
  }

  const missing = await webhookRequest({ dataId })
  assert.equal(missing.response.status, 401, 'unsigned modern webhook must fail')
  assert.equal(missing.body.error, 'missing_signature_headers')

  const invalidRequestId = `p0-sec004-${runId}-invalid`
  const invalid = await webhookRequest({
    dataId,
    requestId: invalidRequestId,
    timestamp,
    signature: '0'.repeat(64),
  })
  assert.equal(invalid.response.status, 401, 'invalid webhook signature must fail')
  assert.equal(invalid.body.error, 'invalid_signature')

  const maxAge = Number(process.env.MP_WEBHOOK_MAX_AGE_SECONDS || 300)
  const expiredTimestamp = String(
    Math.floor(Date.now() / 1000) - maxAge - 60
  )
  const expiredRequestId = `p0-sec004-${runId}-expired`
  const expiredSignature = mercadoPagoSignature(
    process.env.MP_WEBHOOK_SECRET,
    dataId,
    expiredRequestId,
    expiredTimestamp
  )
  const expired = await webhookRequest({
    dataId,
    requestId: expiredRequestId,
    timestamp: expiredTimestamp,
    signature: expiredSignature,
  })
  assert.equal(expired.response.status, 401, 'expired webhook signature must fail')
  assert.equal(expired.body.error, 'expired_signature')

  const oversized = await webhookRequest({
    dataId,
    requestId: 'r'.repeat(257),
    timestamp,
    signature: '0'.repeat(64),
  })
  assert.equal(oversized.response.status, 400, 'oversized webhook input must fail')
  assert.equal(oversized.body.error, 'invalid_signature_input')

  console.log('SEC-004 production webhook authenticity QA passed')
}

async function main() {
  requireQaEnvironment()
  await cleanupQaUser()
  const user = await createQaUser()

  try {
    await verifySec001(user)
    await verifySec002(user)
    await verifySec004()
    console.log('Production P0 security QA passed')
  } finally {
    await cleanupQaUser()
    console.log('P0 QA synthetic account and sessions removed')
  }
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
