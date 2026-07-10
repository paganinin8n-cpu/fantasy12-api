const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { prisma } = require('../dist/lib/prisma')
const {
  CalculateTicketScoreService,
} = require('../dist/services/score/calculate-ticket-score.service')
const {
  ScoreRoundService,
} = require('../dist/services/score/score-round.service')
const {
  RecalculateRankingService,
} = require('../dist/services/ranking/recalculate-ranking.service')
const {
  GetBolaoRankingService,
} = require('../dist/services/bolao/get-bolao-ranking.service')
const {
  BuildMonthlyRankingFromHistoryService,
} = require('../dist/services/ranking/build-monthly-ranking-from-history.service')

const RESULT = Array(12).fill('1').join(',')
const ALL_HITS = RESULT
const ALL_MISSES = Array(12).fill('2').join(',')
const FIVE_HITS = [...Array(5).fill('1'), ...Array(7).fill('2')].join(',')
const SIX_HITS = [...Array(6).fill('1'), ...Array(6).fill('2')].join(',')
const NORMAL = Array(12).fill(1)
const MAX_MULTIPLIERS = [2, 2, 2, 2, 4, 4, 1, 1, 1, 1, 1, 1]

async function main() {
  const scenarioId = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
  const monthStart = new Date()
  monthStart.setUTCDate(1)
  monthStart.setUTCHours(0, 0, 0, 0)
  const atDay = day => new Date(Date.UTC(
    monthStart.getUTCFullYear(),
    monthStart.getUTCMonth(),
    day,
    12
  ))
  const dates = {
    usersCreated: atDay(1),
    preRoundClosed: atDay(2),
    mesaStarted: atDay(3),
    firstMesaRoundClosed: atDay(4),
    lateUserAdmitted: atDay(5),
    finalMesaRoundClosed: atDay(6),
    mesaEnds: atDay(10),
  }
  const periodRef = [
    monthStart.getUTCFullYear(),
    String(monthStart.getUTCMonth() + 1).padStart(2, '0'),
  ].join('-')
  const report = {
    status: 'running',
    scenarioId,
    timezone: 'UTC (datas persistidas); America/Sao_Paulo = UTC-3',
    generatedAt: new Date().toISOString(),
    schedule: Object.fromEntries(
      Object.entries(dates).map(([key, value]) => [key, timestamp(value)])
    ),
    users: {},
    rounds: [],
    mesa: null,
    timeline: [],
  }

  const users = {}
  for (const key of ['creator', 'early', 'late', 'free']) {
    users[key] = await prisma.user.create({
      data: {
        name: `[SIM ${scenarioId}] ${key}`,
        email: `sim-${scenarioId}-${key}@simulation.fantasy12.test`,
        password: 'simulation-account-no-login',
      },
    })
  }
  report.users = Object.fromEntries(
    Object.entries(users).map(([role, user]) => [role, {
      id: user.id,
      email: user.email,
      plan: role === 'free' ? 'FREE' : role === 'creator' ? 'PRO_ANNUAL' : 'PRO_MONTHLY',
    }])
  )

  for (const key of ['creator', 'early', 'late']) {
    await prisma.subscription.create({
      data: {
        userId: users[key].id,
        plan: key === 'creator' ? 'ANNUAL' : 'MONTHLY',
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
  await capture('USERS_CREATED', dates.usersCreated, {
    explanation: 'Todos começam com zero; ainda não há rodada nem Mesa.',
  })

  const maxRound = await prisma.round.aggregate({ _max: { number: true } })
  const firstNumber = (maxRound._max.number ?? 0) + 1
  const scorer = new ScoreRoundService()
  const calculator = new CalculateTicketScoreService()

  const preRound = await createAndScoreRound({
    number: firstNumber,
    closeAt: dates.preRoundClosed,
    label: 'PRE_MESA',
    tickets: [
      ticket('creator', ALL_HITS, NORMAL),
      ticket('early', ALL_MISSES, NORMAL),
      ticket('late', FIVE_HITS, NORMAL),
      ticket('free', SIX_HITS, NORMAL),
    ],
  })
  report.rounds.push(preRound)
  await capture('PRE_MESA_ROUND_SCORED', dates.preRoundClosed, {
    explanation: 'Esta rodada altera o Global, mas deve ficar fora da futura Mesa.',
    roundNumber: preRound.number,
  })

  const globalBeforeMesa = await getGlobalByRole()
  const mesa = await prisma.ranking.create({
    data: {
      id: randomUUID(),
      name: `[SIM ${scenarioId}] Mesa cronologica`,
      description: 'Cenario detalhado de evolucao, janela e entrada tardia',
      type: 'BOLAO',
      status: 'DRAFT',
      startDate: dates.mesaStarted,
      endDate: dates.mesaEnds,
      entryFee: 0,
      maxParticipants: 50,
      currentParticipants: 2,
      createdByUserId: users.creator.id,
    },
  })
  await prisma.rankingParticipant.createMany({
    data: [
      participant(
        mesa.id,
        users.creator.id,
        dates.mesaStarted,
        users.creator.id,
        globalBeforeMesa.creator.scoreTotal
      ),
      participant(
        mesa.id,
        users.early.id,
        dates.mesaStarted,
        users.creator.id,
        globalBeforeMesa.early.scoreTotal
      ),
    ],
  })
  report.mesa = {
    id: mesa.id,
    startDate: timestamp(dates.mesaStarted),
    endDate: timestamp(dates.mesaEnds),
    admissions: [
      admission('creator', dates.mesaStarted, globalBeforeMesa.creator.scoreTotal),
      admission('early', dates.mesaStarted, globalBeforeMesa.early.scoreTotal),
    ],
  }
  await RecalculateRankingService.execute()
  await capture('MESA_CREATED', dates.mesaStarted, {
    explanation: 'Creator e early entram no início. O scoreInitial registra o Global acumulado anterior.',
  })

  const firstMesaRound = await createAndScoreRound({
    number: firstNumber + 1,
    closeAt: dates.firstMesaRoundClosed,
    label: 'MESA_ROUND_1',
    tickets: [
      ticket('creator', ALL_MISSES, NORMAL),
      ticket('early', ALL_MISSES, NORMAL),
      ticket('late', ALL_HITS, NORMAL),
      ticket('free', SIX_HITS, NORMAL),
    ],
  })
  report.rounds.push(firstMesaRound)
  await capture('FIRST_MESA_ROUND_SCORED', dates.firstMesaRoundClosed, {
    explanation: 'Late pontua no Global, mas ainda não participa da Mesa.',
    roundNumber: firstMesaRound.number,
  })

  const globalAtLateAdmission = await getGlobalByRole()
  await prisma.rankingParticipant.create({
    data: participant(
      mesa.id,
      users.late.id,
      dates.lateUserAdmitted,
      users.creator.id,
      globalAtLateAdmission.late.scoreTotal
    ),
  })
  await prisma.ranking.update({
    where: { id: mesa.id },
    data: { currentParticipants: 3 },
  })
  report.mesa.admissions.push(
    admission('late', dates.lateUserAdmitted, globalAtLateAdmission.late.scoreTotal)
  )
  await RecalculateRankingService.execute()
  await capture('LATE_USER_ADMITTED', dates.lateUserAdmitted, {
    explanation: 'Late entra com baseline 17. Os 12 pontos da rodada anterior continuam somente no Global.',
  })

  const finalMesaRound = await createAndScoreRound({
    number: firstNumber + 2,
    closeAt: dates.finalMesaRoundClosed,
    label: 'MESA_ROUND_2',
    tickets: [
      ticket('creator', ALL_MISSES, MAX_MULTIPLIERS),
      ticket('early', ALL_HITS, NORMAL),
      ticket('late', ALL_HITS, NORMAL),
      ticket('free', SIX_HITS, NORMAL),
    ],
  })
  report.rounds.push(finalMesaRound)
  await capture('FINAL_MESA_ROUND_SCORED', dates.finalMesaRoundClosed, {
    explanation: 'Creator recebe -16; a Mesa limita o acumulado exibido a zero. Early e late empatam com 12.',
    roundNumber: finalMesaRound.number,
  })

  const final = report.timeline.at(-1)
  assert.deepEqual(final.global, { creator: -4, early: 12, late: 29, free: 18 })
  assert.deepEqual(final.mesa.entries, {
    creator: { score: 0, scoreRound: -16, position: 3, scoreInitial: 12 },
    early: { score: 12, scoreRound: 12, position: 1, scoreInitial: 0 },
    late: { score: 12, scoreRound: 12, position: 1, scoreInitial: 17 },
  })
  assert.equal(final.monthlyPro.free, undefined)
  assert.equal(final.monthlyGeneral.free.points, 18)

  report.status = 'ok'
  report.completedAt = new Date().toISOString()
  await prisma.auditLog.create({
    data: {
      action: 'COMPETITION_SIMULATION_CREATED',
      entity: 'COMPETITION_SIMULATION',
      entityId: scenarioId,
      metadata: report,
    },
  })
  console.log(JSON.stringify(report, null, 2))

  async function createAndScoreRound({ number, closeAt, label, tickets }) {
    const round = await prisma.round.create({
      data: {
        number,
        status: 'CLOSED',
        result: RESULT,
        openAt: new Date(closeAt.getTime() - 24 * 60 * 60 * 1000),
        closeAt,
      },
    })
    const ticketRows = tickets.map(item => {
      const breakdown = calculator.detail(item.prediction, RESULT, item.multipliers)
      return {
        role: item.role,
        userId: users[item.role].id,
        prediction: item.prediction,
        multipliers: item.multipliers,
        expected: breakdown,
      }
    })
    await prisma.ticket.createMany({
      data: ticketRows.map(item => ({
        userId: item.userId,
        roundId: round.id,
        prediction: item.prediction,
        multipliers: item.multipliers,
      })),
    })
    await scorer.execute(round.id)
    return {
      id: round.id,
      number,
      label,
      openedAt: timestamp(new Date(closeAt.getTime() - 24 * 60 * 60 * 1000)),
      closedAt: timestamp(closeAt),
      result: RESULT,
      tickets: Object.fromEntries(ticketRows.map(item => [item.role, {
        scoreRound: item.expected.total,
        hits: item.expected.hits,
        misses: item.expected.misses,
        doubleHits: item.expected.doubleHits,
        doubleMisses: item.expected.doubleMisses,
        superDoubleHits: item.expected.superDoubleHits,
        superDoubleMisses: item.expected.superDoubleMisses,
        multiplierBonus: item.expected.multiplierBonus,
        multiplierPenalty: item.expected.multiplierPenalty,
      }])),
    }
  }

  async function capture(step, effectiveAt, details) {
    const globalRows = await getGlobalByRole()
    const monthlyGeneralRows = await BuildMonthlyRankingFromHistoryService.execute({
      periodRef,
      scope: 'general',
    })
    const monthlyProRows = await BuildMonthlyRankingFromHistoryService.execute({
      periodRef,
      scope: 'pro',
    })
    const mesaResult = report.mesa
      ? await GetBolaoRankingService.execute({
          rankingId: report.mesa.id,
          viewerUserId: users.creator.id,
        })
      : null
    report.timeline.push({
      step,
      effectiveAt: timestamp(effectiveAt),
      recordedAt: new Date().toISOString(),
      details,
      global: Object.fromEntries(
        Object.entries(globalRows).map(([role, row]) => [role, row.scoreTotal])
      ),
      monthlyGeneral: periodRowsByRole(monthlyGeneralRows),
      monthlyPro: periodRowsByRole(monthlyProRows),
      mesa: mesaResult
        ? {
            startDate: timestamp(mesaResult.ranking.startDate),
            endDate: timestamp(mesaResult.ranking.endDate),
            entries: Object.fromEntries(mesaResult.entries.map(entry => [
              roleFor(entry.userId),
              {
                score: entry.score,
                scoreRound: entry.scoreRound,
                position: entry.position,
                scoreInitial: entry.scoreInitial,
              },
            ])),
          }
        : null,
    })
  }

  async function getGlobalByRole() {
    const rows = await prisma.userScoreHistory.findMany({
      where: { userId: { in: Object.values(users).map(user => user.id) } },
      orderBy: [{ round: { number: 'desc' } }, { createdAt: 'desc' }],
      select: { userId: true, scoreTotal: true, scoreRound: true },
    })
    const latest = new Map()
    for (const row of rows) if (!latest.has(row.userId)) latest.set(row.userId, row)
    return Object.fromEntries(Object.entries(users).map(([role, user]) => [
      role,
      latest.get(user.id) ?? { scoreTotal: 0, scoreRound: 0 },
    ]))
  }

  function periodRowsByRole(rows) {
    const ids = new Set(Object.values(users).map(user => user.id))
    return Object.fromEntries(rows.filter(row => ids.has(row.userId)).map(row => [
      roleFor(row.userId),
      {
        points: row.monthlyPoints,
        lastRoundPoints: row.lastRoundPoints,
        position: row.position,
      },
    ]))
  }

  function roleFor(userId) {
    return Object.entries(users).find(([, user]) => user.id === userId)?.[0] ?? userId
  }
}

function ticket(role, prediction, multipliers) {
  return { role, prediction, multipliers }
}

function participant(
  rankingId,
  userId,
  approvedAt,
  approvedByUserId,
  scoreInitial
) {
  return {
    rankingId,
    userId,
    score: 0,
    scoreInitial,
    status: 'APPROVED',
    approvedAt,
    approvedByUserId,
  }
}

function admission(role, approvedAt, scoreInitial) {
  return {
    role,
    approvedAt: timestamp(approvedAt),
    scoreInitial,
    rule: 'A Mesa conta apenas rodadas com closeAt >= approvedAt e dentro da janela.',
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

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
