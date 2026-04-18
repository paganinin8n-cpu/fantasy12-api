require('dotenv').config()

const { PrismaClient } = require('@prisma/client')

const migrationName = '20260120_bolao_invites'
let prisma

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      'DATABASE_URL nao configurada. Defina a variavel no ambiente ou em um arquivo .env antes de rodar o diagnostico.'
    )
    process.exitCode = 1
    return
  }

  prisma = new PrismaClient()

  console.log('Diagnostico da migration 20260120_bolao_invites')
  console.log('')

  const migrationsTableExists = await prisma.$queryRawUnsafe(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = '_prisma_migrations'
    ) AS "exists";
  `)

  if (!migrationsTableExists?.[0]?.exists) {
    console.log('Tabela _prisma_migrations nao encontrada.')
    console.log('Recomendacao: confirme se este banco foi inicializado via Prisma.')
    return
  }

  const migrationRows = await prisma.$queryRawUnsafe(`
    SELECT
      migration_name,
      started_at,
      finished_at,
      rolled_back_at,
      logs
    FROM "_prisma_migrations"
    WHERE migration_name = '${migrationName}'
    ORDER BY started_at DESC;
  `)

  const bolaoInviteTableExists = await prisma.$queryRawUnsafe(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'bolao_invites'
    ) AS "exists";
  `)

  const latest = migrationRows[0]
  const tableExists = Boolean(bolaoInviteTableExists?.[0]?.exists)

  console.log(`Tabela bolao_invites existe: ${tableExists ? 'sim' : 'nao'}`)

  if (!latest) {
    console.log(`Migration ${migrationName} nao encontrada em _prisma_migrations.`)
    console.log('Recomendacao: rode `npm run prisma:migrate:deploy`.')
    return
  }

  console.log('')
  console.log('Estado registrado em _prisma_migrations:')
  console.log(`- started_at: ${latest.started_at ?? 'null'}`)
  console.log(`- finished_at: ${latest.finished_at ?? 'null'}`)
  console.log(`- rolled_back_at: ${latest.rolled_back_at ?? 'null'}`)

  if (latest.logs) {
    console.log('')
    console.log('Ultimos logs da migration:')
    console.log(String(latest.logs).slice(0, 1200))
  }

  console.log('')

  if (latest.finished_at) {
    console.log('Diagnostico: a migration ja consta como aplicada.')
    console.log('Recomendacao: rode `npm run prisma:migrate:deploy`.')
    return
  }

  if (latest.rolled_back_at) {
    console.log('Diagnostico: a migration ja consta como rolled back.')
    console.log('Recomendacao: rode `npm run prisma:migrate:deploy`.')
    return
  }

  if (tableExists) {
    console.log('Diagnostico: a migration falhou, mas a tabela bolao_invites existe.')
    console.log(
      'Recomendacao: rode `npm run prisma:migrate:resolve:bolao:applied` e depois `npm run prisma:migrate:deploy`.'
    )
    return
  }

  console.log('Diagnostico: a migration falhou e a tabela bolao_invites nao existe.')
  console.log(
    'Recomendacao: rode `npm run prisma:migrate:resolve:bolao:rolled-back` e depois `npm run prisma:migrate:deploy`.'
  )
}

main()
  .catch(error => {
    console.error('Falha ao diagnosticar migration:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    try {
      if (!prisma) {
        return
      }

      await prisma.$disconnect()
    } catch (_error) {
      // noop
    }
  })
