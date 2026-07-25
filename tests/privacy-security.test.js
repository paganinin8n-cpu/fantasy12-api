const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const test = require('node:test')

const {
  maskCpf,
  maskEmail,
  maskPhone,
  minimizeMercadoPagoPayload,
  redactSensitiveMetadata,
} = require('../dist/security/privacy')
const { prisma } = require('../dist/lib/prisma')
const {
  ListAdminUsersService,
} = require('../dist/services/admin/list-admin-users.service')

test('mascara PII e remove segredos de metadados recursivos', () => {
  assert.equal(maskEmail('pessoa@example.com'), 'p***@example.com')
  assert.equal(maskCpf('123.456.789-01'), '***.***.***-01')
  assert.equal(maskPhone('+55 11 99999-1234'), '********1234')

  const result = redactSensitiveMetadata({
    email: 'pessoa@example.com',
    nested: {
      cpf: '12345678901',
      token: 'reset-secret',
      cookie: 'sid=secret',
      signature: 'sha256-secret',
      phone: '5511999991234',
    },
  })
  const serialized = JSON.stringify(result)
  for (const secret of [
    'pessoa@example.com',
    '12345678901',
    'reset-secret',
    'sid=secret',
    'sha256-secret',
    '5511999991234',
  ]) {
    assert.equal(serialized.includes(secret), false)
  }
})

test('logger de produção redige CPF, token, cookie, assinatura e email completo', () => {
  const script =
    "const { logger } = require('./dist/lib/logger');" +
    "logger.info({ email: 'full@example.com', cpf: '12345678901'," +
    "token: 'token-secret', cookie: 'sid=cookie-secret'," +
    "signature: 'signature-secret' }, 'security-log-test')"
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'production' },
  })
  assert.equal(result.status, 0, result.stderr)
  for (const secret of [
    'full@example.com',
    '12345678901',
    'token-secret',
    'cookie-secret',
    'signature-secret',
  ]) {
    assert.equal(result.stdout.includes(secret), false)
  }
  assert.match(result.stdout, /\[redacted\]/)
})

test('payload Mercado Pago mantém somente allowlist escalar', () => {
  assert.deepEqual(
    minimizeMercadoPagoPayload({
      id: 123,
      status: 'approved',
      live_mode: true,
      external_reference: 'f12_payment',
      payer: { email: 'payer@example.com', identification: '12345678901' },
      card: { token: 'card-token' },
      authorization: 'bearer',
    }),
    {
      id: 123,
      status: 'approved',
      external_reference: 'f12_payment',
      live_mode: true,
    }
  )
})

test('listagem administrativa comum não retorna PII sem máscara', async t => {
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.$transaction = originalTransaction
  })
  prisma.$transaction = async () => [
    1,
    [{
      id: 'user-1',
      name: 'Pessoa',
      email: 'pessoa@example.com',
      nickname: 'pessoa',
      role: 'NORMAL',
      adminBlockedAt: null,
      adminBlockedReason: null,
      adminBlockedById: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      wallet: null,
      benefitInventory: [],
      subscription: null,
      UserAdminRole: [],
    }],
  ]
  const result = await ListAdminUsersService.execute({})
  assert.equal(result.data[0].email, 'p***@example.com')
  assert.equal('cpf' in result.data[0], false)
  assert.equal('phone' in result.data[0], false)
})

test('rota de PII exige permissão dedicada e auditoria', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../src/routes/admin-users.routes.ts'),
    'utf8'
  )
  assert.match(source, /\/admin\/users\/:userId\/pii/)
  assert.match(source, /authorize\('USER_PII_READ',\s*\{\s*audit: true/)

  const seed = fs.readFileSync(
    path.resolve(__dirname, '../prisma/seed-admin-permissions.js'),
    'utf8'
  )
  const adminAllowed = seed.match(/const adminAllowed = \[([\s\S]*?)\]/)[1]
  assert.doesNotMatch(adminAllowed, /USER_PII_READ/)
})

test('migration legada e serviços usam minimização do payload', () => {
  const migration = fs.readFileSync(
    path.resolve(
      __dirname,
      '../prisma/migrations/20260725180000_minimize_payment_webhook_payloads/migration.sql'
    ),
    'utf8'
  )
  assert.match(migration, /JSONB_BUILD_OBJECT/)
  assert.doesNotMatch(migration, /payer_email|identification|card/)

  for (const file of [
    'process-mercado-pago-webhook.service.ts',
    '../subscription/process-mp-subscription-created.service.ts',
    '../subscription/process-mp-subscription-updated.service.ts',
    '../subscription/process-mp-subscription-cancelled.service.ts',
  ]) {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../src/services/payment', file),
      'utf8'
    )
    assert.match(source, /minimizeMercadoPagoPayload/)
  }
})
