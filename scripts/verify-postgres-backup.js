#!/usr/bin/env node

require('dotenv').config()

const { execFileSync } = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const PROJECT_ROOT = path.resolve(__dirname, '..')

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--help') args.help = true
    if (arg === '--file') args.file = argv[index + 1]
    if (arg === '--manifest') args.manifest = argv[index + 1]
  }
  return args
}

function usage() {
  console.log(`
Uso:
  npm run db:backup:verify -- --file backups/postgres/fantasy12-manual.dump

Opcional:
  --manifest backups/postgres/fantasy12-manual.manifest.json

Validacoes:
  - arquivo existe
  - checksum bate com manifest, quando informado
  - pg_restore consegue listar o conteudo do dump custom
`)
}

function sha256(filePath) {
  const hash = crypto.createHash('sha256')
  hash.update(fs.readFileSync(filePath))
  return hash.digest('hex')
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

  if (args.manifest) {
    const manifestFile = path.resolve(PROJECT_ROOT, args.manifest)
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'))
    const actual = sha256(backupFile)

    if (manifest.sha256 !== actual) {
      throw new Error(`Checksum invalido. esperado=${manifest.sha256} atual=${actual}`)
    }

    console.log('Checksum OK.')
  }

  const pgRestoreBin = process.env.PG_RESTORE_BIN || 'pg_restore'
  execFileSync(pgRestoreBin, ['--list', backupFile], {
    cwd: PROJECT_ROOT,
    stdio: 'pipe',
    env: process.env,
  })

  console.log('Backup valido: pg_restore --list concluiu com sucesso.')
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
