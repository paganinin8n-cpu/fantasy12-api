const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { prisma } = require('../dist/lib/prisma')
const {
  ScoreRoundService,
} = require('../dist/services/score/score-round.service')
const {
  GetBolaoRankingService,
} = require('../dist/services/bolao/get-bolao-ranking.service')
const {
  BuildMonthlyRankingFromHistoryService,
} = require('../dist/services/ranking/build-monthly-ranking-from-history.service')

const RESULT = Array(12).fill('1').join(',')
const ALL_HITS = RESULT
const ALL_MISSES = Array(12).fill('2').join(',')
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
    preRound: atDay(2),
    mesaStart: atDay(3),
    firstRound: atDay(4),
    lateAdmission: atDay(5),
    secondRound: atDay(6),
    mesaEnd: atDay(10),
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

  for (const key of ['creator', 'early', 'late']) {
    await prisma.subscription.create({
      data: {
        userId: users[key].id,
        plan: key === 'creator' ? 'ANNUAL' : 'MONTHLY',
        status: 'ACTIVE',
        startAt: atDay(1),
        endAt: new Date(Date.UTC(
          monthStart.getUTCFullYear() + 1,
          monthStart.getUTCMonth(),
          1
        )),
      },
    })
  }

  const mesa = await prisma.ranking.create({
    data: {
      id: randomUUID(),
      name: `[SIM ${scenarioId}] Mesa multiusuario`,
      description: 'Cenario automatizado de pontuacao, empate e entrada tardia',
      type: 'BOLAO',
      status: 'DRAFT',
      startDate: dates.mesaStart,
      endDate: dates.mesaEnd,
      entryFee: 0,
      maxParticipants: 50,
      currentParticipants: 3,
      createdByUserId: users.creator.id,
    },
  })

  await prisma.rankingParticipant.createMany({
    data: [
      participant(mesa.id, users.creator.id, dates.mesaStart, users.creator.id),
      participant(mesa.id, users.early.id, dates.mesaStart, users.creator.id),
      participant(mesa.id, users.late.id, dates.lateAdmission, users.creator.id),
    ],
  })

  const maxRound = await prisma.round.aggregate({ _max: { number: true } })
  const firstNumber = (maxRound._max.number ?? 0) + 1
  const rounds = [
    await createRound(firstNumber, dates.preRound),
    await createRound(firstNumber + 1, dates.firstRound),
    await createRound(firstNumber + 2, dates.secondRound),
  ]

  await addTickets(rounds[0].id, [
    [users.creator.id, ALL_HITS, NORMAL],
    [users.early.id, ALL_MISSES, NORMAL],
    [users.late.id, '1,1,1,1,1,2,2,2,2,2,2,2', NORMAL],
    [users.free.id, SIX_HITS, NORMAL],
  ])
  await addTickets(rounds[1].id, [
    [users.creator.id, ALL_MISSES, NORMAL],
    [users.early.id, ALL_MISSES, NORMAL],
    [users.late.id, ALL_HITS, NORMAL],
    [users.free.id, SIX_HITS, NORMAL],
  ])
  await addTickets(rounds[2].id, [
    [users.creator.id, ALL_MISSES, MAX_MULTIPLIERS],
    [users.early.id, ALL_HITS, NORMAL],
    [users.late.id, ALL_HITS, NORMAL],
    [users.free.id, SIX_HITS, NORMAL],
  ])

  const scorer = new ScoreRoundService()
  for (const round of rounds) await scorer.execute(round.id)

  const latestGlobal = await prisma.userScoreHistory.findMany({
    where: { userId: { in: Object.values(users).map(user => user.id) } },
    orderBy: [{ round: { number: 'desc' } }, { createdAt: 'desc' }],
    distinct: ['userId'],
    select: { userId: true, scoreTotal: true, scoreRound: true },
  })
  const globalByUser = Object.fromEntries(
    latestGlobal.map(row => [roleFor(users, row.userId), row])
  )

  assert.equal(globalByUser.creator.scoreTotal, -4)
  assert.equal(globalByUser.early.scoreTotal, 12)
  assert.equal(globalByUser.late.scoreTotal, 29)
  assert.equal(globalByUser.free.scoreTotal, 18)

  const mesaResult = await GetBolaoRankingService.execute({
    rankingId: mesa.id,
    viewerUserId: users.creator.id,
  })
  const mesaByRole = Object.fromEntries(
    mesaResult.entries.map(entry => [roleFor(users, entry.userId), {
      score: entry.score,
      position: entry.position,
    }])
  )
  assert.deepEqual(mesaByRole, {
    early: { score: 12, position: 1 },
    late: { score: 12, position: 1 },
    creator: { score: 0, position: 3 },
  })

  const periodRef = [
    monthStart.getUTCFullYear(),
    String(monthStart.getUTCMonth() + 1).padStart(2, '0'),
  ].join('-')
  const monthlyGeneral = await BuildMonthlyRankingFromHistoryService.execute({
    periodRef,
    scope: 'general',
  })
  const monthlyPro = await BuildMonthlyRankingFromHistoryService.execute({
    periodRef,
    scope: 'pro',
  })
  const simulatedIds = new Set(Object.values(users).map(user => user.id))
  const generalSimulation = monthlyGeneral.filter(row => simulatedIds.has(row.userId))
  const proSimulation = monthlyPro.filter(row => simulatedIds.has(row.userId))

  assert.equal(generalSimulation.length, 4)
  assert.equal(proSimulation.length, 3)
  assert.equal(proSimulation.some(row => row.userId === users.free.id), false)

  await prisma.auditLog.create({
    data: {
      action: 'COMPETITION_SIMULATION_CREATED',
      entity: 'COMPETITION_SIMULATION',
      entityId: scenarioId,
      metadata: {
        mesaId: mesa.id,
        roundIds: rounds.map(round => round.id),
        userIds: Object.fromEntries(
          Object.entries(users).map(([role, user]) => [role, user.id])
        ),
      },
    },
  })

  console.log(JSON.stringify({
    status: 'ok',
    scenarioId,
    mesaId: mesa.id,
    roundIds: rounds.map(round => round.id),
    users: Object.fromEntries(
      Object.entries(users).map(([role, user]) => [role, {
        id: user.id,
        email: user.email,
      }])
    ),
    global: Object.fromEntries(
      Object.entries(globalByUser).map(([role, row]) => [role, row.scoreTotal])
    ),
    mesa: mesaResult.entries.map(entry => ({
      role: roleFor(users, entry.userId),
      score: entry.score,
      position: entry.position,
    })),
    monthlyGeneral: generalSimulation.map(row => ({
      role: roleFor(users, row.userId),
      points: row.monthlyPoints,
      position: row.position,
    })),
    monthlyPro: proSimulation.map(row => ({
      role: roleFor(users, row.userId),
      points: row.monthlyPoints,
      position: row.position,
    })),
  }, null, 2))
}

function participant(rankingId, userId, approvedAt, approvedByUserId) {
  return {
    rankingId,
    userId,
    score: 0,
    scoreInitial: 0,
    status: 'APPROVED',
    approvedAt,
    approvedByUserId,
  }
}

async function createRound(number, closeAt) {
  return prisma.round.create({
    data: {
      number,
      status: 'CLOSED',
      result: RESULT,
      openAt: new Date(closeAt.getTime() - 24 * 60 * 60 * 1000),
      closeAt,
    },
  })
}

async function addTickets(roundId, rows) {
  await prisma.ticket.createMany({
    data: rows.map(([userId, prediction, multipliers]) => ({
      userId,
      roundId,
      prediction,
      multipliers,
    })),
  })
}

function roleFor(users, userId) {
  return Object.entries(users).find(([, user]) => user.id === userId)?.[0] ?? userId
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
