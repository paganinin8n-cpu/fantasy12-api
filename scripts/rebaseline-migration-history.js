#!/usr/bin/env node

require('dotenv').config()

const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { Prisma } = require('@prisma/client')
const { prisma } = require('../dist/lib/prisma')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const DEFAULT_MANIFEST = path.join(
  PROJECT_ROOT,
  'prisma',
  'migration-baseline-cutover-v2.json'
)

function readConfiguration() {
  const manifestPath =
    process.env.MIGRATION_BASELINE_MANIFEST || DEFAULT_MANIFEST
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const migrationsDir =
    process.env.MIGRATION_BASELINE_DIR ||
    path.join(PROJECT_ROOT, 'prisma', 'migrations')

  if (manifest.schemaVersion !== 1) {
    throw new Error('Unsupported migration baseline cutover manifest')
  }
  if (!/^[0-9]{14}_[a-z0-9_]+$/.test(manifest.baselineMigration)) {
    throw new Error('Invalid consolidated baseline migration name')
  }
  if (
    !/^[a-f0-9]{64}$/.test(
      manifest.expectedApplicationSchemaFingerprint
    )
  ) {
    throw new Error('Invalid expected application schema fingerprint')
  }
  if (
    !Array.isArray(manifest.legacyMigrations) ||
    manifest.legacyMigrations.length === 0 ||
    new Set(manifest.legacyMigrations).size !==
      manifest.legacyMigrations.length
  ) {
    throw new Error('Legacy migration manifest is empty or contains duplicates')
  }
  if (
    process.env.ALLOW_MIGRATION_BASELINE_CUTOVER !==
    manifest.baselineMigration
  ) {
    throw new Error(
      `Set ALLOW_MIGRATION_BASELINE_CUTOVER=${manifest.baselineMigration} explicitly`
    )
  }

  const migrationPath = path.join(
    migrationsDir,
    manifest.baselineMigration,
    'migration.sql'
  )
  const migrationSql = fs.readFileSync(migrationPath)

  return {
    manifest,
    migrationPath,
    checksum: crypto.createHash('sha256').update(migrationSql).digest('hex'),
    backupPath:
      process.env.MIGRATION_HISTORY_BACKUP_PATH ||
      path.join(
        PROJECT_ROOT,
        'backups',
        'postgres',
        `migration-history-v1-${new Date()
          .toISOString()
          .replace(/[:.]/g, '-')}.json`
      ),
  }
}

async function getMigrationRows(tx) {
  return tx.$queryRawUnsafe(`
    SELECT
      "id",
      "checksum",
      "finished_at",
      "migration_name",
      "logs",
      "rolled_back_at",
      "started_at",
      "applied_steps_count"
    FROM "_prisma_migrations"
    ORDER BY "started_at", "id"
  `)
}

function successfulMigrationNames(rows) {
  return new Set(
    rows
      .filter(row => row.finished_at != null && row.rolled_back_at == null)
      .map(row => row.migration_name)
  )
}

function assertRecognizedHistory(rows, manifest) {
  const successful = successfulMigrationNames(rows)
  const containsLegacy = rows.some(row =>
    manifest.legacyMigrations.includes(row.migration_name)
  )
  if (
    successful.has(manifest.baselineMigration) &&
    !containsLegacy
  ) {
    return { alreadyConsolidated: true }
  }

  const allowed = new Set([
    manifest.baselineMigration,
    ...manifest.legacyMigrations,
  ])
  const unexpected = [
    ...new Set(
      rows
        .map(row => row.migration_name)
        .filter(name => !allowed.has(name))
    ),
  ]
  if (unexpected.length > 0) {
    throw new Error(
      `Migration history contains unexpected entries: ${unexpected.join(', ')}`
    )
  }

  if (successful.has(manifest.baselineMigration)) {
    return { alreadyConsolidated: false }
  }

  const missing = manifest.legacyMigrations.filter(
    name => !successful.has(name)
  )
  if (missing.length > 0) {
    throw new Error(
      `Migration history is not ready for cutover; missing successful entries: ${missing.join(', ')}`
    )
  }

  return { alreadyConsolidated: false }
}

async function getApplicationSchemaSnapshot(tx) {
  const [columns, constraints, indexes, enums] = await Promise.all([
    tx.$queryRawUnsafe(`
      SELECT
        table_name,
        ordinal_position,
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name <> '_prisma_migrations'
      ORDER BY table_name, ordinal_position
    `),
    tx.$queryRawUnsafe(`
      SELECT
        relation.relname AS table_name,
        constraint_row.conname AS constraint_name,
        constraint_row.contype AS constraint_type,
        pg_get_constraintdef(constraint_row.oid, true) AS definition
      FROM pg_constraint constraint_row
      JOIN pg_class relation ON relation.oid = constraint_row.conrelid
      JOIN pg_namespace namespace_row ON namespace_row.oid = relation.relnamespace
      WHERE namespace_row.nspname = current_schema()
        AND relation.relname <> '_prisma_migrations'
      ORDER BY relation.relname, constraint_row.conname
    `),
    tx.$queryRawUnsafe(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = current_schema()
        AND tablename <> '_prisma_migrations'
      ORDER BY tablename, indexname
    `),
    tx.$queryRawUnsafe(`
      SELECT type_row.typname AS enum_name, enum_row.enumsortorder, enum_row.enumlabel
      FROM pg_type type_row
      JOIN pg_enum enum_row ON enum_row.enumtypid = type_row.oid
      JOIN pg_namespace namespace_row ON namespace_row.oid = type_row.typnamespace
      WHERE namespace_row.nspname = current_schema()
      ORDER BY type_row.typname, enum_row.enumsortorder
    `),
  ])

  return { columns, constraints, indexes, enums }
}

function fingerprint(value) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(value))
    .digest('hex')
}

function assertRequiredStructure(snapshot) {
  const tableNames = new Set(snapshot.columns.map(row => row.table_name))
  for (const name of ['users', 'rounds', 'rankings', 'ranking_participants']) {
    if (!tableNames.has(name)) {
      throw new Error(`Required application table is missing: ${name}`)
    }
  }

  const constraintNames = new Set(
    snapshot.constraints.map(row => row.constraint_name)
  )
  for (const name of [
    'wallets_balance_non_negative',
    'wallet_ledger_amount_positive',
    'round_benefits_free_doubles_non_negative',
    'round_benefits_free_super_doubles_non_negative',
    'user_benefit_inventory_quantity_non_negative',
    'users_email_is_canonical',
    'bolao_invites_used_count_non_negative',
    'bolao_invites_max_uses_positive',
    'bolao_invites_usage_within_limit',
  ]) {
    if (!constraintNames.has(name)) {
      throw new Error(`Required database constraint is missing: ${name}`)
    }
  }

  const indexNames = new Set(snapshot.indexes.map(row => row.indexname))
  for (const name of [
    'rounds_single_open_idx',
    'users_email_canonical_key',
  ]) {
    if (!indexNames.has(name)) {
      throw new Error(`Required database index is missing: ${name}`)
    }
  }
}

function writeBackup(backupPath, payload) {
  fs.mkdirSync(path.dirname(backupPath), { recursive: true })
  fs.writeFileSync(
    backupPath,
    `${JSON.stringify(payload, null, 2)}\n`,
    { encoding: 'utf8', flag: 'wx' }
  )
}

async function execute() {
  const configuration = readConfiguration()
  const { manifest, checksum, backupPath } = configuration

  const result = await prisma.$transaction(
    async tx => {
      const [migrationTableState] = await tx.$queryRawUnsafe(`
        SELECT to_regclass(
          current_schema() || '._prisma_migrations'
        )::text AS migration_table
      `)
      const schemaBefore = await getApplicationSchemaSnapshot(tx)
      const schemaFingerprintBefore = fingerprint(schemaBefore)

      if (migrationTableState.migration_table == null) {
        if (schemaBefore.columns.length > 0) {
          throw new Error(
            'Application tables exist without a Prisma migration history'
          )
        }
        writeBackup(backupPath, {
          createdAt: new Date().toISOString(),
          databaseState: 'fresh',
          baselineMigration: manifest.baselineMigration,
          baselineChecksum: checksum,
          applicationSchemaFingerprint: schemaFingerprintBefore,
          migrationRows: [],
        })
        return {
          backupPath,
          removedRows: 0,
          freshDatabase: true,
          baselineMigration: manifest.baselineMigration,
          baselineChecksum: checksum,
          applicationSchemaFingerprint: schemaFingerprintBefore,
        }
      }

      await tx.$executeRawUnsafe(
        'LOCK TABLE "_prisma_migrations" IN ACCESS EXCLUSIVE MODE'
      )

      const migrationRows = await getMigrationRows(tx)
      if (migrationRows.length === 0 && schemaBefore.columns.length === 0) {
        writeBackup(backupPath, {
          createdAt: new Date().toISOString(),
          databaseState: 'fresh',
          baselineMigration: manifest.baselineMigration,
          baselineChecksum: checksum,
          applicationSchemaFingerprint: schemaFingerprintBefore,
          migrationRows,
        })
        return {
          backupPath,
          removedRows: 0,
          freshDatabase: true,
          baselineMigration: manifest.baselineMigration,
          baselineChecksum: checksum,
          applicationSchemaFingerprint: schemaFingerprintBefore,
        }
      }
      const historyState = assertRecognizedHistory(migrationRows, manifest)

      assertRequiredStructure(schemaBefore)
      if (
        !historyState.alreadyConsolidated &&
        schemaFingerprintBefore !==
          manifest.expectedApplicationSchemaFingerprint
      ) {
        throw new Error(
          `Application schema does not match the validated baseline: expected ${manifest.expectedApplicationSchemaFingerprint}, received ${schemaFingerprintBefore}`
        )
      }

      writeBackup(backupPath, {
        createdAt: new Date().toISOString(),
        baselineMigration: manifest.baselineMigration,
        baselineChecksum: checksum,
        applicationSchemaFingerprint: schemaFingerprintBefore,
        migrationRows,
      })

      if (historyState.alreadyConsolidated) {
        return {
          backupPath,
          removedRows: 0,
          alreadyConsolidated: true,
          baselineMigration: manifest.baselineMigration,
          baselineChecksum: checksum,
          applicationSchemaFingerprint: schemaFingerprintBefore,
        }
      }

      const successful = successfulMigrationNames(migrationRows)
      if (!successful.has(manifest.baselineMigration)) {
        await tx.$executeRaw`
          INSERT INTO "_prisma_migrations" (
            "id",
            "checksum",
            "finished_at",
            "migration_name",
            "logs",
            "rolled_back_at",
            "started_at",
            "applied_steps_count"
          )
          VALUES (
            ${crypto.randomUUID()},
            ${checksum},
            NOW(),
            ${manifest.baselineMigration},
            NULL,
            NULL,
            NOW(),
            1
          )
        `
      }

      await tx.$executeRaw`
        DELETE FROM "_prisma_migrations"
        WHERE "migration_name" IN (${Prisma.join(
          manifest.legacyMigrations
        )})
      `

      const schemaAfter = await getApplicationSchemaSnapshot(tx)
      const schemaFingerprintAfter = fingerprint(schemaAfter)
      if (schemaFingerprintAfter !== schemaFingerprintBefore) {
        throw new Error(
          'Application schema changed during migration history cutover'
        )
      }

      const finalRows = await getMigrationRows(tx)
      const finalSuccessful = successfulMigrationNames(finalRows)
      if (
        finalRows.some(row =>
          manifest.legacyMigrations.includes(row.migration_name)
        ) ||
        !finalSuccessful.has(manifest.baselineMigration)
      ) {
        throw new Error('Migration history cutover did not converge')
      }

      return {
        backupPath,
        removedRows: migrationRows.filter(row =>
          manifest.legacyMigrations.includes(row.migration_name)
        ).length,
        alreadyConsolidated: false,
        baselineMigration: manifest.baselineMigration,
        baselineChecksum: checksum,
        applicationSchemaFingerprint: schemaFingerprintAfter,
      }
    },
    { maxWait: 5_000, timeout: 30_000 }
  )

  console.log('Migration history baseline cutover completed.')
  console.log(JSON.stringify(result, null, 2))
}

execute()
  .catch(error => {
    console.error('Migration history baseline cutover failed.')
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
