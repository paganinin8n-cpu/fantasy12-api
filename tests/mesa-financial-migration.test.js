const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const root = path.resolve(__dirname, '..')

function migration(name) {
  return fs.readFileSync(
    path.join(root, 'prisma', 'migrations', name, 'migration.sql'),
    'utf8'
  )
}

test('expansao financeira de Mesa preserva colunas legadas', () => {
  const sql = migration('20260809010000_add_mesa_financial_columns')

  assert.match(sql, /ADD COLUMN "accessCost" INTEGER/)
  assert.match(sql, /ADD COLUMN "rewardPool" INTEGER/)
  assert.doesNotMatch(sql, /DROP COLUMN/i)
  assert.doesNotMatch(sql, /NOT NULL/i)
})

test('backfill financeiro fica separado da alteracao de schema', () => {
  const sql = migration('20260809011000_backfill_mesa_financial_columns')

  assert.match(sql, /"accessCost" = "entryFee"/)
  assert.match(sql, /"rewardPool" = "prizePool"/)
  assert.doesNotMatch(sql, /ALTER TABLE/i)
})

test('ponte de compatibilidade sincroniza nomes antigos e canonicos', () => {
  const sql = migration('20260809013000_sync_mesa_financial_columns')

  assert.match(sql, /CREATE TRIGGER "rankings_sync_mesa_financial_columns"/)
  assert.match(sql, /NEW\."accessCost" := NEW\."entryFee"/)
  assert.match(sql, /NEW\."rewardPool" := NEW\."prizePool"/)
  assert.doesNotMatch(sql, /DROP COLUMN/i)
})
