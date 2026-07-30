#!/usr/bin/env node

require('dotenv').config()

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { prisma } = require('../dist/lib/prisma')
const {
  CalculateTicketScoreService,
} = require('../dist/services/score/calculate-ticket-score.service')
const {
  ScoreRoundService,
} = require('../dist/services/score/score-round.service')
const {
  BuildMonthlyRankingFromHistoryService,
} = require('../dist/services/ranking/build-monthly-ranking-from-history.service')
const {
  BuildPeriodRankingFromHistoryService,
} = require('../dist/services/ranking/build-period-ranking-from-history.service')
const {
  RankingWindowScoreService,
} = require('../dist/services/ranking/ranking-window-score.service')
const {
  GetBolaoRankingService,
} = require('../dist/services/bolao/get-bolao-ranking.service')
const {
  RANKING_TIEBREAK_RULE_VERSION,
} = require('../dist/services/ranking/ranking-tiebreak.service')

const CAMPAIGN_START = new Date('2026-01-01T00:00:00.000Z')
const CAMPAIGN_END = new Date('2026-07-01T00:00:00.000Z')
const ROUND_COUNT = 26
const OPTIONS = ['1', 'X', '2']
const NORMAL = Array(12).fill(1)

const PLAYERS = {
  super: {
    name: 'Sofia Super',
    createdAt: '2025-06-01T00:00:00.000Z',
    pro: true,
    strategy: 'super',
  },
  double: {
    name: 'Daniel Dupla',
    createdAt: '2025-05-01T00:00:00.000Z',
    pro: true,
    strategy: 'double',
  },
  veteran: {
    name: 'Valter Veterano',
    createdAt: '2024-01-01T00:00:00.000Z',
    pro: true,
    strategy: 'normal-four',
  },
  newcomer: {
    name: 'Nina Nova',
    createdAt: '2025-12-01T00:00:00.000Z',
    pro: true,
    strategy: 'normal-four',
  },
  twinA: {
    name: 'Gêmeo Alfa',
    createdAt: '2025-12-15T00:00:00.000Z',
    pro: true,
    strategy: 'normal-four',
  },
  twinB: {
    name: 'Gêmeo Beta',
    createdAt: '2025-12-15T00:00:00.000Z',
    pro: true,
    strategy: 'normal-four',
  },
  volatile: {
    name: 'Vera Volátil',
    createdAt: '2025-10-01T00:00:00.000Z',
    pro: true,
    strategy: 'volatile',
  },
  free: {
    name: 'Felipe Free',
    createdAt: '2025-08-01T00:00:00.000Z',
    pro: false,
    strategy: 'normal-six',
  },
}

function assertSafeEnvironment() {
  if (process.env.ALLOW_SIX_MONTH_SIMULATION !== 'local-isolated') {
    throw new Error(
      'Set ALLOW_SIX_MONTH_SIMULATION=local-isolated explicitly'
    )
  }

  const databaseUrl = new URL(process.env.DATABASE_URL || '')
  if (!['127.0.0.1', 'localhost'].includes(databaseUrl.hostname)) {
    throw new Error('Six-month simulation is restricted to a local database')
  }
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function resultForRound(roundIndex) {
  return Array.from(
    { length: 12 },
    (_, matchIndex) => OPTIONS[(roundIndex + matchIndex) % OPTIONS.length]
  )
}

function wrongOption(result) {
  return OPTIONS[(OPTIONS.indexOf(result) + 1) % OPTIONS.length]
}

function ticketWithHits(result, hitIndexes, multipliers = NORMAL) {
  const hitSet = new Set(hitIndexes)
  return {
    prediction: result
      .map((value, index) => (hitSet.has(index) ? value : wrongOption(value)))
      .join(','),
    multipliers: [...multipliers],
  }
}

function ticketFor(player, result, roundIndex) {
  if (player.strategy === 'super') {
    const multipliers = [...NORMAL]
    multipliers[0] = 4
    return ticketWithHits(result, [0], multipliers)
  }
  if (player.strategy === 'double') {
    const multipliers = [...NORMAL]
    multipliers[0] = 2
    multipliers[1] = 2
    return ticketWithHits(result, [0, 1], multipliers)
  }
  if (player.strategy === 'normal-six') {
    return ticketWithHits(result, [0, 1, 2, 3, 4, 5])
  }
  if (player.strategy === 'volatile') {
    if (roundIndex < 4) {
      const multipliers = [...NORMAL]
      multipliers[0] = 4
      return ticketWithHits(result, [], multipliers)
    }
    return ticketWithHits(result, [0, 1, 2])
  }
  return ticketWithHits(result, [0, 1, 2, 3])
}

function timestamp(value) {
  const date = new Date(value)
  return {
    utc: date.toISOString(),
    saoPaulo: new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date),
  }
}

function roleFor(users, userId) {
  return Object.entries(users).find(([, user]) => user.id === userId)?.[0]
}

function expectedRank(rows) {
  const sorted = [...rows].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.superDoubleHits !== a.superDoubleHits) {
      return b.superDoubleHits - a.superDoubleHits
    }
    if (b.doubleHits !== a.doubleHits) {
      return b.doubleHits - a.doubleHits
    }
    const createdAt =
      new Date(a.userCreatedAt).getTime() -
      new Date(b.userCreatedAt).getTime()
    if (createdAt !== 0) return createdAt
    return a.userId.localeCompare(b.userId)
  })

  let position = 1
  return sorted.map((row, index) => {
    const previous = sorted[index - 1]
    const sameOfficialPosition =
      previous &&
      previous.score === row.score &&
      previous.superDoubleHits === row.superDoubleHits &&
      previous.doubleHits === row.doubleHits &&
      new Date(previous.userCreatedAt).getTime() ===
        new Date(row.userCreatedAt).getTime()
    if (index > 0 && !sameOfficialPosition) position = index + 1
    return { ...row, position }
  })
}

async function main() {
  assertSafeEnvironment()

  const scenarioId = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
  const calculator = new CalculateTicketScoreService()
  const scorer = new ScoreRoundService()
  const report = {
    status: 'running',
    scenarioId,
    ruleVersion: RANKING_TIEBREAK_RULE_VERSION,
    generatedAt: new Date().toISOString(),
    period: {
      start: timestamp(CAMPAIGN_START),
      endExclusive: timestamp(CAMPAIGN_END),
      months: 6,
      rounds: ROUND_COUNT,
    },
    users: {},
    rounds: [],
    monthlyRankings: [],
    semesterRanking: [],
    globalFinal: [],
    mesas: [],
    checks: [],
    verdict: null,
  }

  const users = {}
  for (const [role, config] of Object.entries(PLAYERS)) {
    const createdAt = new Date(config.createdAt)
    const user = await prisma.user.create({
      data: {
        name: `[SIM6 ${scenarioId}] ${config.name}`,
        nickname: `s6${scenarioId.slice(-6)}${role.toLowerCase()}`,
        email: `sim6-${scenarioId}-${role.toLowerCase()}@simulation.fantasy12.test`,
        password: 'simulation-account-no-login',
        createdAt,
      },
    })
    users[role] = user

    if (config.pro) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'ANNUAL',
          status: 'ACTIVE',
          startAt: CAMPAIGN_START,
          endAt: new Date('2027-01-01T00:00:00.000Z'),
        },
      })
    }

    report.users[role] = {
      id: user.id,
      name: config.name,
      plan: config.pro ? 'PRO' : 'FREE',
      createdAt: timestamp(createdAt),
      strategy: config.strategy,
    }
  }

  const maxRound = await prisma.round.aggregate({ _max: { number: true } })
  const firstRoundNumber = (maxRound._max.number ?? 0) + 1
  const expectedTotals = Object.fromEntries(
    Object.keys(users).map(role => [
      role,
      { score: 0, doubleHits: 0, superDoubleHits: 0 },
    ])
  )

  for (let roundIndex = 0; roundIndex < ROUND_COUNT; roundIndex++) {
    const closeAt = addDays(new Date('2026-01-03T12:00:00.000Z'), roundIndex * 7)
    const result = resultForRound(roundIndex)
    const round = await prisma.round.create({
      data: {
        number: firstRoundNumber + roundIndex,
        status: 'CLOSED',
        result: result.join(','),
        openAt: addDays(closeAt, -1),
        closeAt,
      },
    })
    const ticketReport = {}

    for (const [role, user] of Object.entries(users)) {
      const generated = ticketFor(PLAYERS[role], result, roundIndex)
      const breakdown = calculator.detail(
        generated.prediction,
        result.join(','),
        generated.multipliers
      )
      await prisma.ticket.create({
        data: {
          userId: user.id,
          roundId: round.id,
          prediction: generated.prediction,
          multipliers: generated.multipliers,
        },
      })
      expectedTotals[role].score += breakdown.total
      expectedTotals[role].doubleHits += breakdown.doubleHits
      expectedTotals[role].superDoubleHits += breakdown.superDoubleHits
      ticketReport[role] = {
        scoreRound: breakdown.total,
        hits: breakdown.hits,
        doubleHits: breakdown.doubleHits,
        superDoubleHits: breakdown.superDoubleHits,
      }
    }

    await scorer.execute(round.id)

    const persisted = await prisma.userScoreHistory.findMany({
      where: { roundId: round.id },
      select: {
        userId: true,
        scoreRound: true,
        scoreTotal: true,
        totalDoubles: true,
        totalSuperDoubles: true,
      },
    })
    for (const row of persisted) {
      const role = roleFor(users, row.userId)
      const expected = expectedTotals[role]
      check(
        report,
        `round-${roundIndex + 1}-${role}`,
        row.scoreRound === ticketReport[role].scoreRound &&
          row.scoreTotal === expected.score &&
          row.totalDoubles === expected.doubleHits &&
          row.totalSuperDoubles === expected.superDoubleHits,
        {
          expected,
          persisted: row,
        }
      )
    }

    report.rounds.push({
      id: round.id,
      number: round.number,
      closeAt: timestamp(closeAt),
      month: closeAt.toISOString().slice(0, 7),
      tickets: ticketReport,
    })
  }

  for (let month = 1; month <= 6; month++) {
    const periodRef = `2026-${String(month).padStart(2, '0')}`
    const general = await BuildMonthlyRankingFromHistoryService.execute({
      periodRef,
      scope: 'general',
    })
    const pro = await BuildMonthlyRankingFromHistoryService.execute({
      periodRef,
      scope: 'pro',
    })
    const normalizedGeneral = normalizePeriodRows(general, users)
    const normalizedPro = normalizePeriodRows(pro, users)
    validateTiebreakHierarchy(report, `monthly-${periodRef}`, normalizedGeneral)
    check(
      report,
      `monthly-${periodRef}-free-scope`,
      normalizedGeneral.some(row => row.role === 'free') &&
        !normalizedPro.some(row => row.role === 'free'),
      { general: normalizedGeneral, pro: normalizedPro }
    )
    report.monthlyRankings.push({
      periodRef,
      general: normalizedGeneral,
      pro: normalizedPro,
    })
  }

  const semester = await BuildPeriodRankingFromHistoryService.execute({
    start: CAMPAIGN_START,
    end: CAMPAIGN_END,
    scope: 'general',
  })
  report.semesterRanking = normalizePeriodRows(semester, users)
  validateTiebreakHierarchy(report, 'semester', report.semesterRanking)

  const finalRound = report.rounds.at(-1)
  const snapshots = await prisma.rankingSnapshot.findMany({
    where: {
      roundId: finalRound.id,
      userId: { in: Object.values(users).map(user => user.id) },
    },
    orderBy: [{ position: 'asc' }, { userId: 'asc' }],
  })
  report.globalFinal = snapshots.map(row => ({
    role: roleFor(users, row.userId),
    score: row.scoreTotal,
    scoreRound: row.scoreRound,
    doubleHits: row.totalDoubles,
    superDoubleHits: row.totalSuperDoubles,
    position: row.position,
  }))
  validateTiebreakHierarchy(report, 'global-final', report.globalFinal)

  const mesaDefinitions = [
    {
      key: 'fullSeason',
      name: 'Mesa Temporada Completa',
      startDate: CAMPAIGN_START,
      endDate: CAMPAIGN_END,
      roles: Object.keys(users),
      lateAdmissions: {},
    },
    {
      key: 'negativeBaseline',
      name: 'Mesa Baseline Negativo',
      startDate: new Date('2026-01-28T00:00:00.000Z'),
      endDate: new Date('2026-04-01T00:00:00.000Z'),
      roles: ['super', 'double', 'veteran', 'volatile'],
      lateAdmissions: {},
    },
    {
      key: 'overlap',
      name: 'Mesa Sobreposta de Meio de Temporada',
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      endDate: new Date('2026-06-01T00:00:00.000Z'),
      roles: ['super', 'double', 'veteran', 'newcomer', 'twinA', 'twinB'],
      lateAdmissions: {},
    },
    {
      key: 'lateEntry',
      name: 'Mesa com Entrada Tardia',
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: CAMPAIGN_END,
      roles: ['super', 'double', 'veteran', 'newcomer'],
      lateAdmissions: {
        veteran: new Date('2026-05-01T00:00:00.000Z'),
      },
    },
  ]

  for (const definition of mesaDefinitions) {
    report.mesas.push(
      await createAndValidateMesa({
        report,
        scenarioId,
        users,
        definition,
      })
    )
  }

  const failed = report.checks.filter(item => !item.passed)
  report.status = failed.length === 0 ? 'ok' : 'failed'
  report.completedAt = new Date().toISOString()
  report.verdict = {
    passed: failed.length === 0,
    totalChecks: report.checks.length,
    failedChecks: failed.length,
    summary:
      failed.length === 0
        ? 'Pontuação, rankings, Mesas e desempates consistentes durante seis meses.'
        : 'A campanha encontrou divergências.',
  }

  const outputDir = path.join(
    process.cwd(),
    'docs',
    'simulations'
  )
  fs.mkdirSync(outputDir, { recursive: true })
  const baseName = `six-month-competition-${scenarioId}`
  const jsonPath = path.join(outputDir, `${baseName}.json`)
  const markdownPath = path.join(outputDir, `${baseName}.md`)
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(markdownPath, `${buildMarkdown(report)}\n`)

  console.log(
    JSON.stringify({
      status: report.status,
      scenarioId,
      rounds: report.rounds.length,
      months: report.monthlyRankings.length,
      mesas: report.mesas.length,
      checks: report.verdict,
      jsonPath,
      markdownPath,
    })
  )

  if (failed.length > 0) process.exitCode = 1
}

function normalizePeriodRows(rows, users) {
  return rows
    .filter(row => roleFor(users, row.userId))
    .map(row => ({
      role: roleFor(users, row.userId),
      userId: row.userId,
      score: row.monthlyPoints ?? row.scoreTotal,
      scoreRound: row.lastRoundPoints ?? row.scoreRound,
      doubleHits: row.totalDoubles,
      superDoubleHits: row.totalSuperDoubles,
      position: row.position,
    }))
}

function validateTiebreakHierarchy(report, key, rows) {
  const byRole = Object.fromEntries(rows.map(row => [row.role, row]))
  const required = ['super', 'double', 'veteran', 'newcomer', 'twinA', 'twinB']
  const present = required.every(role => byRole[role])
  const equalScores =
    present &&
    new Set(required.map(role => byRole[role].score)).size === 1
  const hierarchy =
    equalScores &&
    byRole.super.position < byRole.double.position &&
    byRole.double.position < byRole.veteran.position &&
    byRole.veteran.position < byRole.newcomer.position &&
    byRole.newcomer.position < byRole.twinA.position &&
    byRole.twinA.position === byRole.twinB.position

  check(report, `${key}-official-tiebreak`, Boolean(hierarchy), {
    rows: required.map(role => byRole[role] ?? { role, missing: true }),
  })
}

async function createAndValidateMesa({
  report,
  scenarioId,
  users,
  definition,
}) {
  const ranking = await prisma.ranking.create({
    data: {
      id: randomUUID(),
      name: `[SIM6 ${scenarioId}] ${definition.name}`,
      description: 'Campanha longitudinal de validação',
      type: 'BOLAO',
      status: 'ACTIVE',
      startDate: definition.startDate,
      entryEndDate: definition.endDate,
      endDate: definition.endDate,
      entryFee: 0,
      currentParticipants: definition.roles.length,
      prizeDistribution: [{ position: 1, percentage: 100 }],
      createdByUserId: users.super.id,
    },
  })

  const admissions = {}
  for (const role of definition.roles) {
    const approvedAt =
      definition.lateAdmissions[role] ?? definition.startDate
    const scoreInitial = await RankingWindowScoreService.getScoreTotalBefore(
      prisma,
      users[role].id,
      approvedAt
    )
    const participant = await prisma.rankingParticipant.create({
      data: {
        rankingId: ranking.id,
        userId: users[role].id,
        scoreInitial,
        status: 'APPROVED',
        approvedAt,
        approvedByUserId: users.super.id,
      },
    })
    admissions[role] = {
      participantId: participant.id,
      approvedAt,
      scoreInitial,
    }
  }

  const engineRows = await RankingWindowScoreService.buildRows(
    prisma,
    ranking,
    new Date(definition.endDate.getTime() + 1)
  )
  const expectedRows = []
  for (const role of definition.roles) {
    const admission = admissions[role]
    expectedRows.push(
      await expectedMesaRow({
        role,
        user: users[role],
        startDate: admission.approvedAt,
        endDate: definition.endDate,
      })
    )
  }
  const rankedExpected = expectedRank(expectedRows)

  await prisma.$transaction(async tx => {
    for (const row of engineRows) {
      await tx.rankingParticipant.update({
        where: { id: row.participantId },
        data: {
          score: row.score,
          position: row.position,
          tiebreakSuperDoubleHits: row.superDoubleHits,
          tiebreakDoubleHits: row.doubleHits,
          tiebreakUserCreatedAt: row.userCreatedAt,
          tiebreakRuleVersion: RANKING_TIEBREAK_RULE_VERSION,
        },
      })
    }
    await tx.ranking.update({
      where: { id: ranking.id },
      data: { status: 'CLOSED' },
    })
  })

  const view = await GetBolaoRankingService.execute({
    rankingId: ranking.id,
    viewerUserId: users.super.id,
  })
  const stored = await prisma.rankingParticipant.findMany({
    where: { rankingId: ranking.id },
  })
  const validations = []

  for (const expected of rankedExpected) {
    const engine = engineRows.find(row => row.userId === expected.userId)
    const persisted = stored.find(row => row.userId === expected.userId)
    const visible = view.entries.find(row => row.userId === expected.userId)
    const passed =
      engine?.score === expected.score &&
      engine?.position === expected.position &&
      engine?.superDoubleHits === expected.superDoubleHits &&
      engine?.doubleHits === expected.doubleHits &&
      persisted?.score === expected.score &&
      persisted?.position === expected.position &&
      persisted?.scoreInitial === admissions[expected.role].scoreInitial &&
      persisted?.tiebreakRuleVersion === RANKING_TIEBREAK_RULE_VERSION &&
      visible?.score === expected.score &&
      visible?.position === expected.position

    check(report, `mesa-${definition.key}-${expected.role}`, passed, {
      expected,
      engine,
      persisted,
      visible,
    })
    validations.push({
      role: expected.role,
      scoreInitial: admissions[expected.role].scoreInitial,
      score: expected.score,
      superDoubleHits: expected.superDoubleHits,
      doubleHits: expected.doubleHits,
      position: expected.position,
      passed,
    })
  }

  if (definition.key === 'negativeBaseline') {
    check(
      report,
      'mesa-negative-baseline-is-preserved',
      admissions.volatile.scoreInitial < 0,
      { admission: admissions.volatile }
    )
  }

  return {
    key: definition.key,
    id: ranking.id,
    name: definition.name,
    startDate: timestamp(definition.startDate),
    endDate: timestamp(definition.endDate),
    admissions: Object.fromEntries(
      Object.entries(admissions).map(([role, value]) => [
        role,
        {
          approvedAt: timestamp(value.approvedAt),
          scoreInitial: value.scoreInitial,
        },
      ])
    ),
    validations,
  }
}

async function expectedMesaRow({
  role,
  user,
  startDate,
  endDate,
}) {
  const rows = await prisma.userScoreHistory.findMany({
    where: {
      userId: user.id,
      round: { closeAt: { lte: endDate } },
    },
    orderBy: [{ round: { closeAt: 'asc' } }],
    select: {
      scoreRound: true,
      scoreTotal: true,
      totalDoubles: true,
      totalSuperDoubles: true,
      round: { select: { closeAt: true } },
    },
  })
  const baseline = [...rows]
    .reverse()
    .find(row => row.round.closeAt < startDate)
  const current = rows.at(-1)

  return {
    role,
    userId: user.id,
    score: (current?.scoreTotal ?? baseline?.scoreTotal ?? 0) -
      (baseline?.scoreTotal ?? 0),
    scoreRound: current?.scoreRound ?? 0,
    superDoubleHits:
      (current?.totalSuperDoubles ?? 0) -
      (baseline?.totalSuperDoubles ?? 0),
    doubleHits:
      (current?.totalDoubles ?? 0) -
      (baseline?.totalDoubles ?? 0),
    userCreatedAt: user.createdAt,
  }
}

function check(report, key, passed, evidence) {
  report.checks.push({ key, passed, evidence })
}

function buildMarkdown(report) {
  const lines = [
    `# Simulação Fantasy12 — seis meses — ${report.scenarioId}`,
    '',
    `- **Status:** ${report.status}`,
    `- **Período:** ${report.period.start.saoPaulo} até ${report.period.endExclusive.saoPaulo}`,
    `- **Rodadas:** ${report.period.rounds}`,
    `- **Mesas:** ${report.mesas.length}`,
    `- **Regra de desempate:** ${report.ruleVersion}`,
    `- **Verificações:** ${report.verdict.totalChecks - report.verdict.failedChecks}/${report.verdict.totalChecks} aprovadas`,
    '',
    '## Veredito',
    '',
    report.verdict.passed
      ? `**PASSOU** — ${report.verdict.summary}`
      : `**FALHOU** — ${report.verdict.summary}`,
    '',
    '## Cobertura',
    '',
    '- Pontuação positiva, negativa e acumulada rodada a rodada.',
    '- Ranking mensal Geral e PRO em seis competências.',
    '- Ranking semestral e snapshot Global final.',
    '- Desempate por pontos, Super Duplas, Duplas, antiguidade e empate absoluto.',
    '- Mesas de temporada completa, baseline negativo, janelas sobrepostas e entrada tardia.',
    '',
    '## Ranking mensal Geral',
    '',
    '| Mês | 1º | Ordem dos empatados por 4 pontos/rodada |',
    '|---|---|---|',
  ]

  for (const month of report.monthlyRankings) {
    const first = month.general[0]
    const tied = month.general
      .filter(row => ['super', 'double', 'veteran', 'newcomer', 'twinA', 'twinB'].includes(row.role))
      .map(row => `${row.position}. ${row.role}`)
      .join(' → ')
    lines.push(`| ${month.periodRef} | ${first.role} (${first.score}) | ${tied} |`)
  }

  lines.push(
    '',
    '## Mesas',
    '',
    '| Mesa | Janela | Participantes | Validações |',
    '|---|---|---:|---:|'
  )
  for (const mesa of report.mesas) {
    lines.push(
      `| ${mesa.name} | ${mesa.startDate.saoPaulo} → ${mesa.endDate.saoPaulo} | ${mesa.validations.length} | ${mesa.validations.filter(row => row.passed).length}/${mesa.validations.length} |`
    )
  }

  lines.push(
    '',
    '## Ranking Global final',
    '',
    '| Posição | Jogador | Pontos | Super | Duplas |',
    '|---:|---|---:|---:|---:|'
  )
  for (const row of report.globalFinal) {
    lines.push(
      `| ${row.position} | ${row.role} | ${row.score} | ${row.superDoubleHits} | ${row.doubleHits} |`
    )
  }

  const failed = report.checks.filter(item => !item.passed)
  if (failed.length > 0) {
    lines.push('', '## Falhas', '')
    for (const item of failed) {
      lines.push(`- \`${item.key}\``)
    }
  }

  return lines.join('\n')
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
