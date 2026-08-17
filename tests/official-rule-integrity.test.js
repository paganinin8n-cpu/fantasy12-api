const assert = require('node:assert/strict')
const test = require('node:test')
const fs = require('node:fs')
const path = require('node:path')

const { OfficialRoundScheduleService } = require('../dist/services/round/official-round-schedule.service')
const { SaoPauloPeriodService } = require('../dist/services/time/sao-paulo-period.service')
const { MesaIntegrityService } = require('../dist/services/bolao/mesa-integrity.service')
const { CreateMesaSchema } = require('../dist/validators/bolao.validator')
const {
  BolaoRegistrationWindowService,
} = require('../dist/services/bolao/bolao-registration-window.service')

function matches(first, remaining = '2026-07-15T20:00:00-03:00') {
  return Array.from({ length: 12 }, (_, index) => ({
    position: index + 1,
    homeTeam: `Casa ${index + 1}`,
    awayTeam: `Fora ${index + 1}`,
    matchTime: index === 0 ? first : remaining,
  }))
}

test('rodada de quarta abre terça 00:00 em São Paulo e fecha uma hora antes do primeiro jogo', () => {
  const schedule = OfficialRoundScheduleService.derive(matches('2026-07-15T19:00:00-03:00'))
  assert.equal(schedule.openAt.toISOString(), '2026-07-14T03:00:00.000Z')
  assert.equal(schedule.closeAt.toISOString(), '2026-07-15T21:00:00.000Z')
})

test('rodada de sábado abre sexta 00:00 em São Paulo', () => {
  const schedule = OfficialRoundScheduleService.derive(
    matches('2026-07-18T16:00:00-03:00', '2026-07-18T20:00:00-03:00')
  )
  assert.equal(schedule.openAt.toISOString(), '2026-07-17T03:00:00.000Z')
  assert.equal(schedule.closeAt.toISOString(), '2026-07-18T18:00:00.000Z')
})

test('calendário oficial exige os 12 horários e aceita qualquer dia da semana', () => {
  const missing = matches('2026-07-15T19:00:00-03:00')
  missing[4].matchTime = null
  assert.throws(() => OfficialRoundScheduleService.derive(missing), /horário dos 12 jogos/i)
  const thursday = OfficialRoundScheduleService.derive(matches(
    '2026-07-16T19:00:00-03:00',
    '2026-07-16T20:00:00-03:00'
  ))
  assert.equal(thursday.openAt.toISOString(), '2026-07-15T03:00:00.000Z')
  assert.equal(thursday.closeAt.toISOString(), '2026-07-16T21:00:00.000Z')

  const sunday = OfficialRoundScheduleService.derive(matches(
    '2026-07-19T16:00:00-03:00',
    '2026-07-19T20:00:00-03:00'
  ))
  assert.equal(sunday.openAt.toISOString(), '2026-07-18T03:00:00.000Z')
  assert.equal(sunday.closeAt.toISOString(), '2026-07-19T18:00:00.000Z')
})

test('aceita override administrativo válido para abertura e fechamento', () => {
  const schedule = OfficialRoundScheduleService.resolve(
    matches('2026-07-22T19:00:00-03:00', '2026-07-22T20:00:00-03:00'),
    {
      openAt: '2026-07-20T03:00:00.000Z',
      closeAt: '2026-07-22T20:30:00.000Z',
    }
  )

  assert.equal(schedule.openAt.toISOString(), '2026-07-20T03:00:00.000Z')
  assert.equal(schedule.closeAt.toISOString(), '2026-07-22T20:30:00.000Z')
})

test('rejeita override com janela invertida ou fechamento depois do primeiro jogo', () => {
  const roundMatches = matches(
    '2026-07-22T19:00:00-03:00',
    '2026-07-22T20:00:00-03:00'
  )

  assert.throws(
    () => OfficialRoundScheduleService.resolve(roundMatches, {
      openAt: '2026-07-22T21:00:00.000Z',
      closeAt: '2026-07-22T20:00:00.000Z',
    }),
    /antes do fechamento/i
  )

  assert.throws(
    () => OfficialRoundScheduleService.resolve(roundMatches, {
      closeAt: '2026-07-22T22:01:00.000Z',
    }),
    /depois do primeiro jogo/i
  )
})

test('mês oficial respeita meia-noite de São Paulo', () => {
  const july = SaoPauloPeriodService.parse('2026-07')
  assert.equal(july.start.toISOString(), '2026-07-01T03:00:00.000Z')
  assert.equal(july.end.toISOString(), '2026-08-01T03:00:00.000Z')
  assert.equal(SaoPauloPeriodService.periodRef(new Date('2026-08-01T02:30:00Z')), '2026-07')
})

test('diagnóstico de Mesa identifica configuração financeira e pagamentos legados inválidos', () => {
  const issues = MesaIntegrityService.inspect({
    id: 'mesa-1', category: 'PAID', description: ' ', entryFee: 10, prizeDistribution: null,
    maxParticipants: 10, currentParticipants: 2,
    grossCollected: 30, platformFee: 3, prizePool: 27, settledAt: null,
    participants: [
      { status: 'APPROVED', entryFeePaid: 10, entryPaidAt: new Date() },
      { status: 'APPROVED', entryFeePaid: 10, entryPaidAt: null },
    ],
  })
  assert.deepEqual(issues.map(issue => issue.code), [
    'MISSING_PRIZE_RULES', 'INVALID_PRIZE_DISTRIBUTION',
    'APPROVED_ENTRY_NOT_PAID', 'GROSS_COLLECTED_MISMATCH',
  ])
})

test('integridade aceita participantes sem débito em Mesa FREE patrocinada', () => {
  const issues = MesaIntegrityService.inspect({
    id: 'mesa-free',
    category: 'SPONSORED_FREE',
    description: 'Premiação patrocinada integral para o primeiro colocado.',
    entryFee: 0,
    accessCost: 0,
    sponsorPrizePool: 100,
    maxParticipants: 10,
    currentParticipants: 1,
    prizeDistribution: [{ position: 1, percentage: 100 }],
    grossCollected: 0,
    platformFee: 0,
    prizePool: 100,
    rewardPool: 100,
    settledAt: null,
    participants: [
      { status: 'APPROVED', entryFeePaid: 0, entryPaidAt: null },
    ],
  })

  assert.deepEqual(issues, [])
})

test('diagnóstico de Mesa detecta divergência de participantes e capacidade', () => {
  const base = {
    id: 'mesa-capacidade',
    category: 'PAID',
    description: 'Premiação integral conforme regras publicadas.',
    entryFee: 10,
    accessCost: 10,
    prizeDistribution: [{ position: 1, percentage: 100 }],
    grossCollected: 20,
    platformFee: 2,
    prizePool: 18,
    rewardPool: 18,
    settledAt: null,
    participants: [
      { status: 'APPROVED', entryFeePaid: 10, entryPaidAt: new Date() },
      { status: 'APPROVED', entryFeePaid: 10, entryPaidAt: new Date() },
    ],
  }

  const mismatch = MesaIntegrityService.inspect({
    ...base,
    maxParticipants: 10,
    currentParticipants: 3,
  })
  assert.ok(mismatch.some(issue => issue.code === 'PARTICIPANT_COUNT_MISMATCH'))

  const exceeded = MesaIntegrityService.inspect({
    ...base,
    maxParticipants: 1,
    currentParticipants: 2,
  })
  assert.ok(exceeded.some(issue => issue.code === 'CAPACITY_EXCEEDED'))

  const missing = MesaIntegrityService.inspect({
    ...base,
    maxParticipants: null,
    currentParticipants: 2,
  })
  assert.ok(missing.some(issue => issue.code === 'MISSING_PARTICIPANT_LIMIT'))
})

test('diagnóstico rejeita combinações inválidas de categoria, acesso e prêmio', () => {
  const base = {
    id: 'mesa-termos',
    description: 'Premiação integral conforme regras publicadas.',
    prizeDistribution: [{ position: 1, percentage: 100 }],
    grossCollected: 0,
    platformFee: 0,
    prizePool: 0,
    rewardPool: 0,
    settledAt: null,
    maxParticipants: 10,
    currentParticipants: 0,
    participants: [],
  }

  const paid = MesaIntegrityService.inspect({
    ...base,
    category: 'PAID',
    entryFee: 0,
    accessCost: 0,
    sponsorPrizePool: 10,
  })
  assert.ok(paid.some(issue => issue.code === 'INVALID_PAID_ACCESS_COST'))
  assert.ok(paid.some(issue => issue.code === 'INVALID_PAID_SPONSOR_POOL'))

  const sponsored = MesaIntegrityService.inspect({
    ...base,
    category: 'SPONSORED_FREE',
    entryFee: 5,
    accessCost: 5,
    sponsorPrizePool: 0,
  })
  assert.ok(sponsored.some(issue => issue.code === 'INVALID_SPONSORED_ACCESS_COST'))
  assert.ok(sponsored.some(issue => issue.code === 'INVALID_SPONSORED_PRIZE_POOL'))
})

test('nova criação rejeita data final de inscrição legada', () => {
  const result = CreateMesaSchema.safeParse({
    name: 'Mesa sem conflito de janela',
    description: 'Premiação integral conforme regras publicadas.',
    startDate: '2099-01-01T00:00:00.000Z',
    entryEndDate: '2099-01-15T00:00:00.000Z',
    endDate: '2099-02-01T00:00:00.000Z',
    category: 'PAID',
    accessCost: 10,
    sponsorPrizePool: 0,
    maxParticipants: 50,
    prizeDistribution: [{ position: 1, percentage: 100 }],
  })

  assert.equal(result.success, false)
})

test('data legada de inscrição não antecipa o fechamento da Mesa', () => {
  assert.doesNotThrow(() => BolaoRegistrationWindowService.assertOpen({
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    entryEndDate: new Date('2026-01-15T00:00:00.000Z'),
    endDate: new Date('2099-02-01T00:00:00.000Z'),
  }, new Date('2026-01-16T00:00:00.000Z')))
})

test('diagnóstico administrativo informa execução e Mesas vencidas sem liquidação', async () => {
  const now = Date.now()
  const report = await MesaIntegrityService.diagnose({
    ranking: {
      findMany: async () => [{
        id: 'mesa-vencida',
        name: 'Mesa vencida',
        status: 'ACTIVE',
        endDate: new Date(now - 60_000),
        description: 'Premiação integral conforme regras publicadas.',
        entryFee: 0,
        accessCost: 0,
        category: 'SPONSORED_FREE',
        sponsorPrizePool: 100,
        prizeDistribution: [{ position: 1, percentage: 100 }],
        grossCollected: 0,
        platformFee: 0,
        prizePool: 100,
        rewardPool: 100,
        settledAt: null,
        maxParticipants: 10,
        currentParticipants: 1,
        participants: [{ status: 'APPROVED', entryFeePaid: 0, entryPaidAt: null }],
      }],
    },
  })

  assert.equal(report.inspected, 1)
  assert.equal(report.affected, 0)
  assert.equal(report.expiredUnsettled, 1)
  assert.equal(report.records.length, 1)
  assert.equal(report.records[0].expiredUnsettled, true)
  assert.match(report.checkedAt, /^\d{4}-\d{2}-\d{2}T/)
})

test('rota de diagnóstico de Mesas exige leitura administrativa e auditoria', () => {
  const source = fs.readFileSync(path.join(
    __dirname, '..', 'src', 'routes', 'admin-bolao.routes.ts'
  ), 'utf8')

  assert.match(source, /['"]\/api\/admin\/mesas\/integrity['"]/)
  assert.match(
    source,
    /\/api\/admin\/mesas\/integrity[\s\S]+?authorize\(['"]COMPETITION_READ['"],[\s\S]+?audit:\s*true[\s\S]+?AdminBolaoController\.integrity/
  )
})

test('banco possui defesa final para impedir duas rodadas OPEN', () => {
  const baseline = require('../prisma/migration-baseline-cutover-v2.json')
  const migration = path.join(
    __dirname, '..', 'prisma', 'migrations',
    baseline.baselineMigration, 'migration.sql'
  )
  assert.equal(fs.existsSync(migration), true)
  const sql = fs.readFileSync(migration, 'utf8')
  assert.match(sql, /CREATE UNIQUE INDEX[\s\S]+WHERE "status" = 'OPEN'/i)
})

test('fechamento de ranking persiste auditoria versionada do desempate oficial', () => {
  const baseline = require('../prisma/migration-baseline-cutover-v2.json')
  const migration = path.join(
    __dirname, '..', 'prisma', 'migrations',
    baseline.baselineMigration, 'migration.sql'
  )
  assert.equal(fs.existsSync(migration), true)

  const sql = fs.readFileSync(migration, 'utf8')
  assert.match(sql, /tiebreakSuperDoubleHits/)
  assert.match(sql, /tiebreakDoubleHits/)
  assert.match(sql, /tiebreakUserCreatedAt/)
  assert.match(sql, /tiebreakRuleVersion/)

  const closeRankingSource = fs.readFileSync(path.join(
    __dirname, '..', 'src', 'services', 'ranking', 'close-ranking.service.ts'
  ), 'utf8')
  assert.match(closeRankingSource, /RANKING_TIEBREAK_RULE_VERSION/)
  assert.match(closeRankingSource, /tiebreakSuperDoubleHits:\s*row\.superDoubleHits/)
  assert.match(closeRankingSource, /tiebreakDoubleHits:\s*row\.doubleHits/)
  assert.match(closeRankingSource, /tiebreakUserCreatedAt:\s*row\.userCreatedAt/)
})
