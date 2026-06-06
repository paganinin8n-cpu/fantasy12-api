const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const packagePath = path.join(repoRoot, 'package.json')
const baselinePath = path.join(repoRoot, 'prisma', 'baselines', 'current-fresh-schema.sql')
const bootstrapPath = path.join(repoRoot, 'scripts', 'bootstrap-database.js')
const migrationDocsPath = path.join(repoRoot, 'docs', 'database-bootstrap.md')

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

  assert(fs.existsSync(baselinePath), 'fresh baseline SQL is missing')
  assert(
    pkg.scripts['prisma:bootstrap:fresh']?.includes('scripts/bootstrap-database.js'),
    'official fresh bootstrap script is missing'
  )
  assert(
    bootstrap.includes('Database is not empty. Bootstrap via db push was blocked.'),
    'fresh bootstrap must block non-empty databases by default'
  )
  assert(
    bootstrap.includes('migrate') &&
      bootstrap.includes('resolve') &&
      bootstrap.includes('--applied'),
    'fresh bootstrap must mark historical migrations as applied'
  )
  assert(
    bootstrap.includes('--skip-migration-resolve'),
    'fresh bootstrap must expose an explicit escape hatch for migration resolve'
  )
  assert(
    normalizedDocs.includes('banco vazio') &&
      normalizedDocs.includes('marca as migrations historicas como aplicadas'),
    'database bootstrap docs must describe the fresh database migration policy'
  )

  if (!process.exitCode) {
    console.log('Migration policy check passed.')
  }
}

main()
