#!/usr/bin/env node

const { execFileSync } = require('node:child_process')
const path = require('node:path')
const { prisma } = require('../dist/lib/prisma')

const PROJECT_ROOT = path.resolve(__dirname, '..')

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

async function main() {
  const allowExisting = process.argv.includes('--allow-existing')
  const skipSeed = process.argv.includes('--skip-seed')

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
