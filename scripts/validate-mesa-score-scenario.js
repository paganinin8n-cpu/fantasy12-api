/**
 * Cenário de validação de score de Mesa:
 * - 2 usuários PRO novos
 * - 4 rodadas com closeAt escalonado
 * - 2 mesas com janelas distintas
 * - resultados aleatórios (RNG seeded)
 * - compara esperado (scoreTotalNaJanela - scoreInitial) vs engine/stored
 *
 * Uso: npm run build && node scripts/validate-mesa-score-scenario.js
 */
const { assertSimulationEnvironment } = require('./simulation-environment-guard')

assertSimulationEnvironment()

const { randomUUID } = require('node:crypto')
const { prisma } = require('../dist/lib/prisma')
const {
  CalculateTicketScoreService,
} = require('../dist/services/score/calculate-ticket-score.service')
const {
  ScoreRoundService,
} = require('../dist/services/score/score-round.service')
const {
  RankingWindowScoreService,
} = require('../dist/services/ranking/ranking-window-score.service')
const {
  RecalculateRankingService,
} = require('../dist/services/ranking/recalculate-ranking.service')
const {
  GetBolaoRankingService,
} = require('../dist/services/bolao/get-bolao-ranking.service')

const RESULT = Array(12).fill('1').join(',')
const OPTIONS = ['1', 'X', '2']

function createRng(seed) {
  let state = seed >>> 0
  if (state === 0) state = 0x9e3779b9
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function timestamp(date) {
  if (!date) return null
  const value = new Date(date)
  return {
    utc: value.toISOString(),
    saoPaulo: new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(value),
  }
}

function randomTicket(rng) {
  const prediction = []
  const multipliers = []
  let doubles = 0
  let supers = 0

  for (let i = 0; i < 12; i++) {
    prediction.push(OPTIONS[Math.floor(rng() * OPTIONS.length)])
    const roll = rng()
    if (roll < 0.12 && doubles < 5) {
      multipliers.push(2)
      doubles++
    } else if (roll < 0.2 && supers < 3) {
      multipliers.push(4)
      supers++
    } else {
      multipliers.push(1)
    }
  }

  return {
    prediction: prediction.join(','),
    multipliers,
  }
}

async function main() {
  const scenarioId = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
  const seed = Number(scenarioId.slice(-9)) || 42
  const rng = createRng(seed)

  const monthStart = new Date()
  monthStart.setUTCDate(1)
  monthStart.setUTCHours(0, 0, 0, 0)
  const atDay = (day, hour = 12) =>
    new Date(Date.UTC(
      monthStart.getUTCFullYear(),
      monthStart.getUTCMonth(),
      day,
      hour,
      0,
      0
    ))

  // Timeline relativa ao mês corrente (closeAts históricos).
  // Mesa A cobre R2+R3; Mesa B cobre R3+R4.
  const dates = {
    usersCreated: atDay(1, 10),
    r1Close: atDay(2, 12),
    mesaAStart: atDay(3, 0),
    r2Close: atDay(4, 12),
    mesaBStart: atDay(5, 0),
    r3Close: atDay(6, 12),
    mesaAEnd: atDay(7, 0),
    r4Close: atDay(8, 12),
    mesaBEnd: atDay(9, 0),
  }

  const report = {
    status: 'running',
    scenarioId,
    seed,
    formula: 'scoreMesa = scoreTotalCurrent(até endDate) - scoreInitial(antes de startDate)',
    timezone: 'UTC persistido; BRT = America/Sao_Paulo',
    generatedAt: new Date().toISOString(),
    schedule: Object.fromEntries(
      Object.entries(dates).map(([key, value]) => [key, timestamp(value)])
    ),
    users: {},
    rounds: [],
    mesas: [],
    validations: [],
    verdict: null,
  }

  const users = {}
  for (const role of ['alpha', 'beta']) {
    const label = role === 'alpha' ? 'Alpha PRO' : 'Beta PRO'
    users[role] = await prisma.user.create({
      data: {
        name: `[SCORETEST ${scenarioId}] ${label}`,
        email: `scoretest-${scenarioId}-${role}@simulation.fantasy12.test`,
        password: 'scoretest-account-no-login',
        nickname: `st${scenarioId.slice(-8)}${role[0]}`,
      },
    })
    await prisma.subscription.create({
      data: {
        userId: users[role].id,
        plan: 'MONTHLY',
        status: 'ACTIVE',
        startAt: dates.usersCreated,
        endAt: new Date(Date.UTC(
          monthStart.getUTCFullYear() + 1,
          monthStart.getUTCMonth(),
          1
        )),
      },
    })
  }

  report.users = Object.fromEntries(
    Object.entries(users).map(([role, user]) => [
      role,
      {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: 'PRO_MONTHLY',
      },
    ])
  )

  const maxRound = await prisma.round.aggregate({ _max: { number: true } })
  let nextNumber = (maxRound._max.number ?? 0) + 1
  const scorer = new ScoreRoundService()
  const calculator = new CalculateTicketScoreService()

  async function createAndScoreRound({ label, closeAt }) {
    const number = nextNumber++
    const openAt = new Date(closeAt.getTime() - 24 * 60 * 60 * 1000)
    const round = await prisma.round.create({
      data: {
        number,
        status: 'CLOSED',
        result: RESULT,
        openAt,
        closeAt,
      },
    })

    const tickets = {}
    for (const role of Object.keys(users)) {
      const generated = randomTicket(rng)
      const breakdown = calculator.detail(
        generated.prediction,
        RESULT,
        generated.multipliers
      )
      await prisma.ticket.create({
        data: {
          userId: users[role].id,
          roundId: round.id,
          prediction: generated.prediction,
          multipliers: generated.multipliers,
        },
      })
      tickets[role] = {
        prediction: generated.prediction,
        multipliers: generated.multipliers,
        scoreRound: breakdown.total,
        hits: breakdown.hits,
        misses: breakdown.misses,
        doubleHits: breakdown.doubleHits,
        doubleMisses: breakdown.doubleMisses,
        superDoubleHits: breakdown.superDoubleHits,
        superDoubleMisses: breakdown.superDoubleMisses,
      }
    }

    await scorer.execute(round.id)
    await RecalculateRankingService.execute()

    const row = {
      id: round.id,
      number,
      label,
      openedAt: timestamp(openAt),
      closedAt: timestamp(closeAt),
      result: RESULT,
      tickets,
    }
    report.rounds.push(row)
    return row
  }

  async function createMesa({ key, name, startDate, endDate, roundsCovered }) {
    const scoreInitials = {}
    for (const role of Object.keys(users)) {
      scoreInitials[role] = await RankingWindowScoreService.getScoreTotalBefore(
        prisma,
        users[role].id,
        startDate
      )
    }

    const mesa = await prisma.ranking.create({
      data: {
        id: randomUUID(),
        name: `[SCORETEST ${scenarioId}] ${name}`,
        description: `Validação de score — janela cobre ${roundsCovered.join('+')}`,
        type: 'BOLAO',
        status: 'ACTIVE',
        startDate,
        entryEndDate: endDate,
        endDate,
        entryFee: 0,
        maxParticipants: 10,
        currentParticipants: 2,
        prizeDistribution: [{ position: 1, percentage: 100 }],
        grossCollected: 0,
        platformFee: 0,
        prizePool: 0,
        createdByUserId: users.alpha.id,
      },
    })

    const nowIso = new Date()
    for (const role of Object.keys(users)) {
      await prisma.rankingParticipant.create({
        data: {
          rankingId: mesa.id,
          userId: users[role].id,
          score: 0,
          scoreInitial: scoreInitials[role],
          status: 'APPROVED',
          approvedAt: startDate,
          approvedByUserId: users.alpha.id,
          entryFeePaid: 0,
          entryPaidAt: nowIso,
        },
      })
    }

    await RecalculateRankingService.execute()

    const mesaReport = {
      key,
      id: mesa.id,
      name: mesa.name,
      roundsCovered,
      startDate: timestamp(startDate),
      endDate: timestamp(endDate),
      admissions: Object.fromEntries(
        Object.entries(scoreInitials).map(([role, scoreInitial]) => [
          role,
          {
            scoreInitial,
            rule: 'scoreInitial = scoreTotal antes de startDate (closeAt < startDate)',
          },
        ])
      ),
    }
    report.mesas.push(mesaReport)
    return { mesa, startDate, endDate, scoreInitials, mesaReport }
  }

  async function expectedForUser(userId, startDate, endDate) {
    const scoreInitial = await RankingWindowScoreService.getScoreTotalBefore(
      prisma,
      userId,
      startDate
    )
    const history = await prisma.userScoreHistory.findFirst({
      where: {
        userId,
        round: { closeAt: { lte: endDate } },
      },
      orderBy: [{ round: { closeAt: 'desc' } }, { createdAt: 'desc' }],
      select: {
        scoreTotal: true,
        scoreRound: true,
        round: { select: { number: true, closeAt: true } },
      },
    })
    const historiesInWindow = await prisma.userScoreHistory.findMany({
      where: {
        userId,
        round: {
          closeAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      orderBy: [{ round: { closeAt: 'asc' } }],
      select: {
        scoreRound: true,
        scoreTotal: true,
        round: { select: { number: true, closeAt: true } },
      },
    })

    const scoreTotalCurrent = history?.scoreTotal ?? 0
    const expected = RankingWindowScoreService.calculateScoreFromBaseline(
      scoreTotalCurrent,
      scoreInitial
    )

    return {
      scoreInitial,
      scoreTotalCurrent,
      expected,
      lastRoundInWindow: history?.round
        ? {
            number: history.round.number,
            closeAt: timestamp(history.round.closeAt),
            scoreRound: history.scoreRound,
          }
        : null,
      historiesInWindow: historiesInWindow.map(row => ({
        round: row.round.number,
        closeAt: timestamp(row.round.closeAt),
        scoreRound: row.scoreRound,
        scoreTotal: row.scoreTotal,
      })),
    }
  }

  // R1 fora das mesas
  await createAndScoreRound({ label: 'R1_OUTSIDE', closeAt: dates.r1Close })

  const mesaA = await createMesa({
    key: 'mesaA',
    name: 'Mesa A (R2+R3)',
    startDate: dates.mesaAStart,
    endDate: dates.mesaAEnd,
    roundsCovered: ['R2', 'R3'],
  })

  await createAndScoreRound({ label: 'R2_IN_A', closeAt: dates.r2Close })

  const mesaB = await createMesa({
    key: 'mesaB',
    name: 'Mesa B (R3+R4)',
    startDate: dates.mesaBStart,
    endDate: dates.mesaBEnd,
    roundsCovered: ['R3', 'R4'],
  })

  await createAndScoreRound({ label: 'R3_IN_A_AND_B', closeAt: dates.r3Close })
  await createAndScoreRound({ label: 'R4_IN_B_ONLY', closeAt: dates.r4Close })

  // Congela scores stored com asOf = endDate+1 (mesmas regras do repair/close)
  const mesaContexts = [mesaA, mesaB]
  for (const ctx of mesaContexts) {
    const asOf = new Date(ctx.endDate.getTime() + 1)
    const rows = await RankingWindowScoreService.buildRows(
      prisma,
      {
        id: ctx.mesa.id,
        startDate: ctx.startDate,
        endDate: ctx.endDate,
      },
      asOf
    )

    await prisma.$transaction(async tx => {
      for (const row of rows) {
        await tx.rankingParticipant.update({
          where: { id: row.participantId },
          data: {
            score: row.score,
            position: row.position,
          },
        })
      }
      await tx.ranking.update({
        where: { id: ctx.mesa.id },
        data: { status: 'CLOSED' },
      })
    })
  }

  let allPassed = true

  for (const ctx of mesaContexts) {
    const asOf = new Date(ctx.endDate.getTime() + 1)
    const engineRows = await RankingWindowScoreService.buildRows(
      prisma,
      {
        id: ctx.mesa.id,
        startDate: ctx.startDate,
        endDate: ctx.endDate,
      },
      asOf
    )
    const rankingView = await GetBolaoRankingService.execute({
      rankingId: ctx.mesa.id,
      viewerUserId: users.alpha.id,
    })
    const storedParticipants = await prisma.rankingParticipant.findMany({
      where: { rankingId: ctx.mesa.id },
      select: {
        userId: true,
        score: true,
        scoreInitial: true,
        position: true,
      },
    })

    for (const role of Object.keys(users)) {
      const userId = users[role].id
      const expected = await expectedForUser(userId, ctx.startDate, ctx.endDate)
      const engine = engineRows.find(row => row.userId === userId)
      const stored = storedParticipants.find(row => row.userId === userId)
      const view = rankingView.entries.find(entry => entry.userId === userId)

      const checks = {
        engineMatchesExpected: engine?.score === expected.expected,
        storedMatchesExpected: stored?.score === expected.expected,
        viewMatchesExpected: view?.score === expected.expected,
        scoreInitialMatches: stored?.scoreInitial === expected.scoreInitial,
      }
      const passed = Object.values(checks).every(Boolean)
      if (!passed) allPassed = false

      report.validations.push({
        mesa: ctx.mesaReport.key,
        mesaId: ctx.mesa.id,
        role,
        userId,
        roundsCovered: ctx.mesaReport.roundsCovered,
        expected,
        engine: engine
          ? {
              score: engine.score,
              scoreInitial: engine.scoreInitial,
              scoreTotalCurrent: engine.scoreTotalCurrent,
              scoreRound: engine.scoreRound,
              position: engine.position,
            }
          : null,
        stored: stored
          ? {
              score: stored.score,
              scoreInitial: stored.scoreInitial,
              position: stored.position,
            }
          : null,
        rankingView: view
          ? {
              score: view.score,
              scoreInitial: view.scoreInitial,
              position: view.position,
            }
          : null,
        checks,
        passed,
      })
    }
  }

  report.status = allPassed ? 'ok' : 'failed'
  report.verdict = {
    passed: allPassed,
    summary: allPassed
      ? 'Score de mesa consistente: esperado = engine = stored = ranking view'
      : 'Inconsistência detectada entre esperado, engine, stored ou ranking view',
    totalChecks: report.validations.length,
    failedChecks: report.validations.filter(item => !item.passed).length,
  }
  report.completedAt = new Date().toISOString()
  report.markdown = buildMarkdown(report)

  await prisma.auditLog.create({
    data: {
      action: 'MESA_SCORE_VALIDATION_CREATED',
      entity: 'MESA_SCORE_VALIDATION',
      entityId: scenarioId,
      metadata: {
        status: report.status,
        seed: report.seed,
        verdict: report.verdict,
        mesaIds: report.mesas.map(mesa => mesa.id),
        userIds: Object.values(report.users).map(user => user.id),
      },
    },
  })

  console.log(JSON.stringify(report, null, 2))

  if (!allPassed) {
    process.exitCode = 1
  }
}

function buildMarkdown(report) {
  const lines = []
  lines.push(`# Validação de score de Mesa — ${report.scenarioId}`)
  lines.push('')
  lines.push(`- **Status:** ${report.status}`)
  lines.push(`- **Seed:** \`${report.seed}\``)
  lines.push(`- **Gerado em:** ${report.generatedAt}`)
  lines.push(`- **Fórmula:** \`${report.formula}\``)
  lines.push('')
  lines.push('## Veredito')
  lines.push('')
  lines.push(
    report.verdict.passed
      ? `**PASSOU** — ${report.verdict.summary}`
      : `**FALHOU** — ${report.verdict.summary} (${report.verdict.failedChecks}/${report.verdict.totalChecks})`
  )
  lines.push('')
  lines.push('## Usuários')
  lines.push('')
  for (const [role, user] of Object.entries(report.users)) {
    lines.push(`- **${role}**: ${user.name} (\`${user.email}\`) — ${user.id}`)
  }
  lines.push('')
  lines.push('## Timeline')
  lines.push('')
  for (const [key, value] of Object.entries(report.schedule)) {
    lines.push(`- **${key}**: ${value.saoPaulo} (UTC ${value.utc})`)
  }
  lines.push('')
  lines.push('## Rodadas')
  lines.push('')
  for (const round of report.rounds) {
    lines.push(
      `### ${round.label} (#${round.number}) — close ${round.closedAt.saoPaulo}`
    )
    for (const [role, ticket] of Object.entries(round.tickets)) {
      lines.push(
        `- ${role}: scoreRound=${ticket.scoreRound} (hits=${ticket.hits}, misses=${ticket.misses}, 2x hit/miss=${ticket.doubleHits}/${ticket.doubleMisses}, 4x hit/miss=${ticket.superDoubleHits}/${ticket.superDoubleMisses})`
      )
    }
    lines.push('')
  }
  lines.push('## Mesas')
  lines.push('')
  for (const mesa of report.mesas) {
    lines.push(`### ${mesa.key} — ${mesa.name}`)
    lines.push(`- id: \`${mesa.id}\``)
    lines.push(`- janela: ${mesa.startDate.saoPaulo} → ${mesa.endDate.saoPaulo}`)
    lines.push(`- cobre: ${mesa.roundsCovered.join(', ')}`)
    for (const [role, admission] of Object.entries(mesa.admissions)) {
      lines.push(`- ${role} scoreInitial=${admission.scoreInitial}`)
    }
    lines.push('')
  }
  lines.push('## Validações')
  lines.push('')
  lines.push('| Mesa | User | Initial | Current | Expected | Engine | Stored | View | Pass |')
  lines.push('|---|---|---:|---:|---:|---:|---:|---:|:---:|')
  for (const row of report.validations) {
    lines.push(
      `| ${row.mesa} | ${row.role} | ${row.expected.scoreInitial} | ${row.expected.scoreTotalCurrent} | ${row.expected.expected} | ${row.engine?.score ?? '—'} | ${row.stored?.score ?? '—'} | ${row.rankingView?.score ?? '—'} | ${row.passed ? 'OK' : 'FAIL'} |`
    )
  }
  lines.push('')
  for (const row of report.validations.filter(item => !item.passed)) {
    lines.push(`### Falha: ${row.mesa}/${row.role}`)
    lines.push('```json')
    lines.push(JSON.stringify({ checks: row.checks, expected: row.expected, engine: row.engine, stored: row.stored, rankingView: row.rankingView }, null, 2))
    lines.push('```')
    lines.push('')
  }
  return lines.join('\n')
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
