const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const root = path.resolve(__dirname, '..')
const manifest = require('../prisma/migration-baseline-cutover-v2.json')
const baselinePath = path.join(
  root,
  'prisma',
  'migrations',
  manifest.baselineMigration,
  'migration.sql'
)

test('baseline V2 é a primeira migration ativa e cria o schema completo', () => {
  const migrationsDir = path.join(root, 'prisma', 'migrations')
  const activeMigrations = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()

  assert.equal(activeMigrations[0], manifest.baselineMigration)
  assert.ok(
    activeMigrations.slice(1).every(migration => migration > manifest.baselineMigration),
    'migrations posteriores devem permanecer depois da baseline consolidada'
  )
  assert.ok(
    activeMigrations.includes('20260806010000_add_user_pro_upsell_preference')
  )

  const sql = fs.readFileSync(baselinePath, 'utf8')
  for (const fragment of [
    'CREATE TABLE "users"',
    'CREATE TABLE "rounds"',
    'CREATE TABLE "rankings"',
    'CREATE TABLE "ranking_participants"',
    '"rounds_single_open_idx"',
    '"wallets_balance_non_negative"',
    '"users_email_is_canonical"',
    '"bolao_invites_usage_within_limit"',
  ]) {
    assert.match(sql, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('manifesto preserva a lista completa e remove o legado da pasta ativa', () => {
  assert.equal(manifest.schemaVersion, 1)
  assert.match(
    manifest.expectedApplicationSchemaFingerprint,
    /^[a-f0-9]{64}$/
  )
  assert.deepEqual(
    manifest.acceptedExistingApplicationSchemaFingerprints,
    ['0fc83249e039b517692137d7ad5194699bffb141336ac48da0eced6ffc6f2909']
  )
  assert.equal(manifest.legacyMigrations.length, 35)
  assert.equal(new Set(manifest.legacyMigrations).size, 35)

  for (const migration of manifest.legacyMigrations) {
    assert.equal(
      fs.existsSync(path.join(root, 'prisma', 'migrations', migration)),
      false
    )
  }
})

test('cutover protege histórico e prova que o schema funcional não mudou', () => {
  const script = fs.readFileSync(
    path.join(root, 'scripts', 'rebaseline-migration-history.js'),
    'utf8'
  )

  assert.match(script, /ALLOW_MIGRATION_BASELINE_CUTOVER/)
  assert.match(
    script,
    /LOCK TABLE "_prisma_migrations" IN ACCESS EXCLUSIVE MODE/
  )
  assert.match(script, /applicationSchemaFingerprint/)
  assert.match(script, /expectedApplicationSchemaFingerprint/)
  assert.match(script, /acceptedExistingApplicationSchemaFingerprints/)
  assert.match(script, /Application schema changed during migration history cutover/)
  assert.match(script, /databaseState: 'fresh'/)
  assert.match(
    script,
    /Application tables exist without a Prisma migration history/
  )
  assert.match(script, /flag: 'wx'/)
})

test('deploy faz cutover antes de executar migrations na pasta isolada', () => {
  const workflow = fs.readFileSync(
    path.join(root, '.github', 'workflows', 'deploy.yml'),
    'utf8'
  )
  const cutoverIndex = workflow.indexOf(
    'node /app/scripts/rebaseline-migration-history.js'
  )
  const deployIndex = workflow.indexOf(
    './node_modules/.bin/prisma migrate deploy'
  )

  assert.notEqual(cutoverIndex, -1)
  assert.notEqual(deployIndex, -1)
  assert.ok(cutoverIndex < deployIndex)
  assert.match(workflow, /STAGED_PRISMA="\/tmp\/fantasy12-prisma-/)
  assert.match(workflow, /MIGRATION_HISTORY_BACKUP_PATH/)
  assert.match(workflow, /CUTOVER_STATUS=\$\?/)
  assert.match(workflow, /Migration cutover diagnostic backup:/)
  assert.match(workflow, /docker exec "\$API_CONTAINER" cat "\$MIGRATION_BACKUP"/)
})

test('bootstrap fresh usa migrate deploy e não reescreve histórico', () => {
  const bootstrap = fs.readFileSync(
    path.join(root, 'scripts', 'bootstrap-database.js'),
    'utf8'
  )

  assert.match(bootstrap, /\['prisma', 'migrate', 'deploy'\]/)
  assert.doesNotMatch(bootstrap, /\['prisma', 'db', 'push'/)
  assert.doesNotMatch(bootstrap, /migrate.*resolve/)
})
