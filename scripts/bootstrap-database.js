#!/usr/bin/env node

const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const { prisma } = require('../dist/lib/prisma')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'prisma', 'migrations')
const SINGLE_OPEN_ROUND_CONSTRAINT = path.join(
  PROJECT_ROOT, 'prisma', 'constraints', 'single-open-round.sql'
)

function run(command, args) {
  execFileSync(command, args, {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    env: process.env,
  })
}

async function getPublicTables() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
    ORDER BY tablename
  `)

  return rows.map((row) => row.tablename)
}

function getMigrationNames() {
  return fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

function markMigrationsApplied() {
  const migrations = getMigrationNames()

  if (migrations.length === 0) {
    console.log('No Prisma migrations found to mark as applied.')
    return
  }

  console.log('Marking historical Prisma migrations as applied...')

  for (const migration of migrations) {
    run('npx', ['prisma', 'migrate', 'resolve', '--applied', migration])
  }
}

async function main() {
  const allowExisting = process.argv.includes('--allow-existing')
  const skipSeed = process.argv.includes('--skip-seed')
  const skipMigrationResolve = process.argv.includes('--skip-migration-resolve')

  console.log('Inspecting database state...')
  const tables = await getPublicTables()

  if (tables.length > 0 && !allowExisting) {
    console.error('')
    console.error('Database is not empty. Bootstrap via db push was blocked.')
    console.error('Existing public tables:')
    for (const table of tables) {
      console.error(`- ${table}`)
    }
    console.error('')
    console.error('Use this bootstrap only for fresh environments.')
    console.error('For existing databases, prefer the explicit migration flow.')
    process.exit(1)
  }

  console.log('Running prisma db push...')
  run('npx', ['prisma', 'db', 'push', '--skip-generate'])

  console.log('Applying database-only operational constraints...')
  run('npx', [
    'prisma', 'db', 'execute',
    '--file', SINGLE_OPEN_ROUND_CONSTRAINT,
    '--schema', 'prisma/schema.prisma',
  ])

  if (!skipMigrationResolve) {
    markMigrationsApplied()
  }

  if (!skipSeed) {
    console.log('Seeding admin permissions...')
    run('node', ['prisma/seed-admin-permissions.js'])

    console.log('Seeding application data...')
    run('node', ['prisma/seed.js'])
  }

  console.log('Database bootstrap completed successfully.')
}

main()
  .catch((error) => {
    console.error('Database bootstrap failed.')
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
