const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const packagePath = path.join(repoRoot, 'package.json')
const baselinePath = path.join(repoRoot, 'prisma', 'baselines', 'current-fresh-schema.sql')
const bootstrapPath = path.join(repoRoot, 'scripts', 'bootstrap-database.js')
const migrationDocsPath = path.join(repoRoot, 'docs', 'database-bootstrap.md')
const cutoverManifestPath = path.join(
  repoRoot,
  'prisma',
  'migration-baseline-cutover-v2.json'
)
const cutoverScriptPath = path.join(
  repoRoot,
  'scripts',
  'rebaseline-migration-history.js'
)
const singleOpenConstraintPath = path.join(
  repoRoot, 'prisma', 'constraints', 'single-open-round.sql'
)
const nonNegativeBalancesConstraintPath = path.join(
  repoRoot, 'prisma', 'constraints', 'non-negative-balances.sql'
)
const canonicalUserIdentityConstraintPath = path.join(
  repoRoot, 'prisma', 'constraints', 'canonical-user-identity.sql'
)
const bolaoInviteIntegrityConstraintPath = path.join(
  repoRoot, 'prisma', 'constraints', 'bolao-invite-integrity.sql'
)

function assert(condition, message) {
  if (!condition) {
    console.error(`Migration policy check failed: ${message}`)
    process.exitCode = 1
  }
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function main() {
  const pkg = JSON.parse(read(packagePath))
  const bootstrap = read(bootstrapPath)
  const docs = read(migrationDocsPath)
  const normalizedDocs = docs.toLowerCase()
  const cutoverManifest = JSON.parse(read(cutoverManifestPath))
  const consolidatedBaselinePath = path.join(
    repoRoot,
    'prisma',
    'migrations',
    cutoverManifest.baselineMigration,
    'migration.sql'
  )
  const consolidatedBaseline = read(consolidatedBaselinePath)

  assert(fs.existsSync(baselinePath), 'fresh baseline SQL is missing')
  assert(
    fs.existsSync(singleOpenConstraintPath),
    'database-only single OPEN round constraint is missing'
  )
  assert(
    fs.existsSync(nonNegativeBalancesConstraintPath),
    'database-only non-negative balance constraints are missing'
  )
  assert(
    fs.existsSync(canonicalUserIdentityConstraintPath),
    'database-only canonical user identity constraints are missing'
  )
  assert(
    fs.existsSync(bolaoInviteIntegrityConstraintPath),
    'database-only bolao invite integrity constraints are missing'
  )
  assert(
    pkg.scripts['prisma:bootstrap:fresh']?.includes('scripts/bootstrap-database.js'),
    'official fresh bootstrap script is missing'
  )
  assert(
    bootstrap.includes('Database is not empty. Bootstrap via db push was blocked.'),
    'fresh bootstrap must block non-empty databases by default'
  )
  assert(
    bootstrap.includes("'prisma', 'migrate', 'deploy'"),
    'fresh bootstrap must apply the consolidated migration chain'
  )
  assert(
    !bootstrap.includes("'prisma', 'db', 'push'") &&
      !bootstrap.includes("'prisma', 'migrate', 'resolve'"),
    'fresh bootstrap must not bypass the consolidated migration chain'
  )
  assert(
    fs.existsSync(cutoverScriptPath),
    'controlled migration history cutover script is missing'
  )
  assert(
    pkg.scripts['prisma:migrate:baseline:cutover']?.includes(
      'scripts/rebaseline-migration-history.js'
    ),
    'controlled migration history cutover command is missing'
  )
  assert(
    consolidatedBaseline.includes('CREATE TABLE "users"') &&
      consolidatedBaseline.includes('CREATE TABLE "rounds"') &&
      consolidatedBaseline.includes('CREATE TABLE "rankings"') &&
      consolidatedBaseline.includes('rounds_single_open_idx') &&
      consolidatedBaseline.includes('wallets_balance_non_negative') &&
      consolidatedBaseline.includes('users_email_is_canonical') &&
      consolidatedBaseline.includes(
        'bolao_invites_usage_within_limit'
      ),
    'consolidated baseline must include schema and database-only invariants'
  )
  assert(
    cutoverManifest.legacyMigrations.every(
      migration =>
        !fs.existsSync(
          path.join(repoRoot, 'prisma', 'migrations', migration)
        )
    ),
    'legacy migrations must not remain in the active migration directory'
  )
  assert(
    normalizedDocs.includes('banco vazio') &&
      normalizedDocs.includes('baseline consolidada') &&
      normalizedDocs.includes('prisma migrate deploy'),
    'database bootstrap docs must describe the consolidated baseline policy'
  )

  if (!process.exitCode) {
    console.log('Migration policy check passed.')
  }
}

main()
