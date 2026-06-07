#!/usr/bin/env node

require('dotenv').config()

const { execFileSync } = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { normalizePostgresUrl } = require('./lib/postgres-url')

const PROJECT_ROOT = path.resolve(__dirname, '..')

function parseArgs(argv) {
  const args = {
    outputDir: process.env.BACKUP_DIR || path.join(PROJECT_ROOT, 'backups', 'postgres'),
    label: process.env.BACKUP_LABEL || 'manual',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--help') args.help = true
    if (arg === '--output-dir') args.outputDir = argv[index + 1]
    if (arg === '--label') args.label = argv[index + 1]
  }

  return args
}

function usage() {
  console.log(`
Uso:
  npm run db:backup -- --label pre-deploy

Variaveis:
  DATABASE_URL                 URL do Postgres origem
  BACKUP_DIR                   diretorio destino (default: backups/postgres)
  BACKUP_LABEL                 rotulo do arquivo (default: manual)
  PG_DUMP_BIN                  binario pg_dump customizado
  BACKUP_UPLOAD_COMMAND        comando opcional de upload com {file} e {manifest}

Saida:
  fantasy12-<label>-<timestamp>.dump
  fantasy12-<label>-<timestamp>.manifest.json
`)
}

function safeLabel(value) {
  return String(value || 'manual')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'manual'
}

function sha256(filePath) {
  const hash = crypto.createHash('sha256')
  hash.update(fs.readFileSync(filePath))
  return hash.digest('hex')
}

function run(command, args) {
  execFileSync(command, args, {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    env: process.env,
  })
}

function runUploadCommand(commandTemplate, replacements) {
  const command = commandTemplate
    .replaceAll('{file}', replacements.file)
    .replaceAll('{manifest}', replacements.manifest)

  execFileSync(command, {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  })
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    usage()
    return
  }

  const { connectionUrl, schema } = normalizePostgresUrl(process.env.DATABASE_URL)
  const outputDir = path.resolve(PROJECT_ROOT, args.outputDir)
  fs.mkdirSync(outputDir, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const baseName = `fantasy12-${safeLabel(args.label)}-${timestamp}`
  const backupFile = path.join(outputDir, `${baseName}.dump`)
  const manifestFile = path.join(outputDir, `${baseName}.manifest.json`)
  const pgDumpBin = process.env.PG_DUMP_BIN || 'pg_dump'

  console.log(`Gerando backup Postgres do schema "${schema}"...`)
  run(pgDumpBin, [
    '--format=custom',
    '--compress=9',
    '--no-owner',
    '--no-privileges',
    '--schema',
    schema,
    '--file',
    backupFile,
    connectionUrl,
  ])

  const stat = fs.statSync(backupFile)
  const manifest = {
    createdAt: new Date().toISOString(),
    project: 'fantasy12-api',
    type: 'postgres-custom',
    schema,
    file: path.basename(backupFile),
    sizeBytes: stat.size,
    sha256: sha256(backupFile),
    pgDumpBin,
    retention: process.env.BACKUP_RETENTION || 'daily-7 weekly-4 monthly-3',
  }

  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`)

  if (process.env.BACKUP_UPLOAD_COMMAND) {
    console.log('Executando BACKUP_UPLOAD_COMMAND...')
    runUploadCommand(process.env.BACKUP_UPLOAD_COMMAND, {
      file: backupFile,
      manifest: manifestFile,
    })
  }

  console.log('Backup concluido.')
  console.log(`Arquivo: ${backupFile}`)
  console.log(`Manifest: ${manifestFile}`)
  console.log(`SHA256: ${manifest.sha256}`)
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
