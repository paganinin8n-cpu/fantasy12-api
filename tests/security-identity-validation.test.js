const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const { CreateUserSchema } = require('../dist/validators/createUser.validator')
const {
  AdminPaidBenefitMutationSchema,
  AdminWalletMutationSchema,
} = require('../dist/validators/admin-monetization.validator')
const { CreateTeamSchema } = require('../dist/validators/team.validator')
const { hashPassword, verifyPassword } = require('../dist/security/password')

test('cadastro persiste identidade canônica e aceita senha longa sem truncamento bcrypt', async () => {
  const parsed = CreateUserSchema.parse({
    name: 'Usuário Seguro',
    nickname: 'seguro',
    email: '  USER@Example.COM ',
    cpf: '123.456.789-01',
    phone: '+55 (11) 99999-9999',
    password: `Á${'longa'.repeat(20)}1`,
    birthDate: '1990-01-15',
  })

  assert.equal(parsed.email, 'user@example.com')
  assert.equal(parsed.cpf, '12345678901')
  assert.equal(parsed.phone, '5511999999999')

  const first = `Á${'x'.repeat(80)}a1`
  const second = `Á${'x'.repeat(80)}b1`
  const hash = await hashPassword(first)
  assert.equal(await verifyPassword(first, hash), true)
  assert.equal(await verifyPassword(second, hash), false)
})

test('schemas sensíveis rejeitam tipo incorreto, overflow, enum inválido e campo extra', () => {
  assert.equal(AdminWalletMutationSchema.safeParse({ amount: '10', reason: 'teste' }).success, false)
  assert.equal(AdminWalletMutationSchema.safeParse({
    amount: Number.MAX_SAFE_INTEGER + 1,
    reason: 'teste',
  }).success, false)
  assert.equal(AdminPaidBenefitMutationSchema.safeParse({
    amount: 1,
    type: 'TRIPLE',
  }).success, false)
  assert.equal(CreateTeamSchema.safeParse({
    name: 'Time',
    type: 'CLUB',
    unexpected: true,
  }).success, false)
})

test('baseline consolidada protege unicidade de identidade canônica', () => {
  const baseline = require('../prisma/migration-baseline-cutover-v2.json')
  const migration = fs.readFileSync(
    path.resolve(
      __dirname,
      `../prisma/migrations/${baseline.baselineMigration}/migration.sql`
    ),
    'utf8'
  )
  assert.ok(
    baseline.legacyMigrations.includes(
      '20260725120000_canonical_user_identity'
    )
  )
  assert.match(migration, /CREATE UNIQUE INDEX[\s\S]+"users_email_canonical_key"/)
  assert.match(migration, /CHECK \("email" = LOWER\(BTRIM\("email"\)\)\)/)
})

test('lockout incrementa tentativas atomicamente no PostgreSQL', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../src/services/auth/login.service.ts'),
    'utf8'
  )
  assert.match(source, /"failedLoginAttempts" = "failedLoginAttempts" \+ 1/)
  assert.match(source, /WHEN "failedLoginAttempts" \+ 1 >=/)
  assert.doesNotMatch(source, /const nextAttempts = user\.failedLoginAttempts \+ 1/)
})
