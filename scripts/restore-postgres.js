#!/usr/bin/env node

require('dotenv').config()

const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const { normalizePostgresUrl } = require('./lib/postgres-url')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const CONFIRM_FLAG = '--yes-i-know-this-drops-data'

function parseArgs(argv) {
  const args = {
    dryRun: false,
    confirm: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--help') args.help = true
    if (arg === '--file') args.file = argv[index + 1]
    if (arg === '--target-url') args.targetUrl = argv[index + 1]
    if (arg === '--dry-run') args.dryRun = true
    if (arg === CONFIRM_FLAG) args.confirm = true
  }

  return args
}

function usage() {
  console.log(`
Uso seguro:
  npm run db:restore -- --file backups/postgres/fantasy12.dump --target-url "$RESTORE_DATABASE_URL" --dry-run
  npm run db:restore -- --file backups/postgres/fantasy12.dump --target-url "$RESTORE_DATABASE_URL" ${CONFIRM_FLAG}

Regras de protecao:
  - nunca usa DATABASE_URL como alvo implicitamente
  - exige --target-url ou RESTORE_DATABASE_URL
  - exige ${CONFIRM_FLAG} para restore real
  - bloqueia restore em DATABASE_URL quando ALLOW_RESTORE_OVER_DATABASE_URL nao for true
`)
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    usage()
    return
  }

  if (!args.file) {
    usage()
    process.exit(1)
  }

  const backupFile = path.resolve(PROJECT_ROOT, args.file)
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup nao encontrado: ${backupFile}`)
  }

  const targetRawUrl = args.targetUrl || process.env.RESTORE_DATABASE_URL
  if (!targetRawUrl) {
    throw new Error('Informe --target-url ou RESTORE_DATABASE_URL')
  }

  if (
    process.env.DATABASE_URL &&
    targetRawUrl === process.env.DATABASE_URL &&
    process.env.ALLOW_RESTORE_OVER_DATABASE_URL !== 'true'
  ) {
    throw new Error(
      'Restore bloqueado: alvo igual a DATABASE_URL. Use banco descartavel ou ALLOW_RESTORE_OVER_DATABASE_URL=true.'
    )
  }

  const { connectionUrl, schema } = normalizePostgresUrl(targetRawUrl)
  const pgRestoreBin = process.env.PG_RESTORE_BIN || 'pg_restore'

  if (args.dryRun) {
    execFileSync(pgRestoreBin, ['--list', backupFile], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: process.env,
    })
    console.log(`Dry-run OK. Restore real ainda nao foi executado. Schema alvo: ${schema}`)
    return
  }

  if (!args.confirm) {
    usage()
    throw new Error(`Restore real exige ${CONFIRM_FLAG}`)
  }

  execFileSync(
    pgRestoreBin,
    [
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
      '--schema',
      schema,
      '--dbname',
      connectionUrl,
      backupFile,
    ],
    {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: process.env,
    }
  )

  console.log('Restore concluido.')
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
