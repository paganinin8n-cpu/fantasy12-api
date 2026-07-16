const assert = require('node:assert/strict')
const test = require('node:test')

const { prisma } = require('../dist/lib/prisma')
const {
  CalculateTicketScoreService,
} = require('../dist/services/score/calculate-ticket-score.service')
const {
  ScoreRoundService,
} = require('../dist/services/score/score-round.service')
const {
  SnapshotRankingService,
} = require('../dist/services/ranking/snapshot-ranking.service')
const {
  RecalculateRankingService,
} = require('../dist/services/ranking/recalculate-ranking.service')
const {
  RankingWindowScoreService,
} = require('../dist/services/ranking/ranking-window-score.service')
const {
  GetBolaoRankingService,
} = require('../dist/services/bolao/get-bolao-ranking.service')
const {
  normalizeRoundResult,
} = require('../dist/services/round/round-match.types')
const {
  SetRoundResultService,
} = require('../dist/services/round/set-round-result.service')

test('calcula pontos, bonus e penalidades dos 12 jogos', () => {
  const calculator = new CalculateTicketScoreService()
  const result = '1,X,2,1,X,2,1,X,2,1,X,2'
  const prediction = '1,2,2,X,X,1,1,X,1,1,2,2'
  const multipliers = [1, 2, 4, 1, 2, 4, 1, 2, 4, 1, 2, 4]

  assert.deepEqual(calculator.detail(prediction, result, multipliers), {
    hits: 7,
    misses: 5,
    doubleHits: 2,
    doubleMisses: 2,
    superDoubleHits: 2,
    superDoubleMisses: 2,
    basePoints: 7,
    multiplierBonus: 8,
    multiplierPenalty: 12,
    total: 3,
  })
})

test('palpite legado x com espaços pontua igual a X canônico', () => {
  const calculator = new CalculateTicketScoreService()
  const result = ['X', ...Array(11).fill('1')].join(',')
  const multipliers = Array(12).fill(1)
  assert.equal(
    calculator.execute([' x ', ...Array(11).fill('1')].join(','), result, multipliers),
    calculator.execute(result, result, multipliers)
  )
})

test('preserva a pontuacao oficial de -48 para doze Super Duplas erradas', () => {
  const calculator = new CalculateTicketScoreService()

  assert.equal(
    calculator.execute(
      Array(12).fill('1').join(','),
      Array(12).fill('2').join(','),
      Array(12).fill(4)
    ),
    -48
  )
})

test('jogo cancelado vale zero mesmo com Dupla ou Super Dupla', () => {
  const calculator = new CalculateTicketScoreService()
  const breakdown = calculator.detail(
    Array(12).fill('1').join(','),
    ['C', 'C', ...Array(10).fill('2')].join(','),
    [2, 4, ...Array(10).fill(1)]
  )

  assert.deepEqual(breakdown, {
    hits: 0,
    misses: 10,
    doubleHits: 0,
    doubleMisses: 0,
    superDoubleHits: 0,
    superDoubleMisses: 0,
    basePoints: 0,
    multiplierBonus: 0,
    multiplierPenalty: 0,
    total: 0,
  })
})

test('resultado consolidado aceita C para identificar partida cancelada', () => {
  const result = normalizeRoundResult(
    ['C', ...Array(11).fill('1')].join(',')
  )

  assert.equal(result[0], 'C')
})

test('salva partida cancelada explicitamente e sem placar individual', async t => {
  const originalFindUnique = prisma.round.findUnique
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.round.findUnique = originalFindUnique
    prisma.$transaction = originalTransaction
  })

  const matches = Array.from({ length: 12 }, (_, index) => ({
    id: `match-${index + 1}`,
    position: index + 1,
  }))
  const updatedMatches = []

  prisma.round.findUnique = async () => ({
    status: 'CLOSED',
    matches,
  })
  prisma.$transaction = async callback => callback({
    round: { update: async () => ({}) },
    roundMatch: {
      update: async ({ where, data }) => {
        updatedMatches.push({ id: where.id, ...data })
      },
    },
  })

  await SetRoundResultService.execute(
    'round-1',
    ['C', ...Array(11).fill('1')].join(',')
  )

  assert.deepEqual(updatedMatches[0], {
    id: 'match-1',
    cancelled: true,
    result: null,
  })
  assert.deepEqual(updatedMatches[1], {
    id: 'match-2',
    cancelled: false,
    result: '1',
  })
})

test('apura nova rodada a partir do ultimo acumulado cronologico, mesmo apos queda', async t => {
  const originalTransaction = prisma.$transaction
  const originalRecalculate = RecalculateRankingService.execute
  const originalSnapshot = SnapshotRankingService.execute
  t.after(() => {
    prisma.$transaction = originalTransaction
    RecalculateRankingService.execute = originalRecalculate
    SnapshotRankingService.execute = originalSnapshot
  })

  let createdHistory = null
  let updatedUserScore = null
  prisma.$transaction = async callback => callback({
    round: {
      findUnique: async () => ({
        id: 'round-3',
        status: 'CLOSED',
        result: '1,1,1,1,1,1,1,1,1,1,1,1',
        tickets: [{
          id: 'ticket-3',
          userId: 'user-1',
          prediction: '1,1,1,1,1,1,1,1,1,1,1,1',
          multipliers: Array(12).fill(1),
        }],
      }),
      update: async () => ({}),
    },
    ticket: { update: async () => ({}) },
    user: {
      update: async ({ where, data }) => {
        updatedUserScore = { where, data }
        return { scoreTotal: 17 }
      },
    },
    userScoreHistory: {
      findFirst: async args => {
        assert.deepEqual(args.orderBy, [
          { round: { number: 'desc' } },
          { createdAt: 'desc' },
        ])
        return { scoreTotal: 5, totalDoubles: 2, totalSuperDoubles: 1 }
      },
      create: async ({ data }) => {
        createdHistory = data
      },
    },
  })
  RecalculateRankingService.execute = async () => {}
  SnapshotRankingService.execute = async () => {}

  await new ScoreRoundService().execute('round-3')

  assert.equal(createdHistory.scoreRound, 12)
  assert.equal(createdHistory.scoreTotal, 17)
  assert.deepEqual(updatedUserScore, {
    where: { id: 'user-1' },
    data: { scoreTotal: { increment: 12 } },
  })
  assert.equal(createdHistory.totalDoubles, 2)
  assert.equal(createdHistory.totalSuperDoubles, 1)
})

test('snapshot usa o acumulado mais recente e nao o maior pico historico', async t => {
  const originalTransaction = prisma.$transaction
  t.after(() => {
    prisma.$transaction = originalTransaction
  })

  let createdSnapshots = null
  prisma.$transaction = async callback => callback({
    round: {
      findUnique: async () => ({
        id: 'round-2',
        status: 'SCORED',
        number: 2,
        updatedAt: new Date('2026-07-09T12:00:00Z'),
      }),
      findMany: async () => [{ id: 'round-1' }, { id: 'round-2' }],
    },
    rankingSnapshot: {
      findFirst: async () => null,
      createMany: async ({ data }) => {
        createdSnapshots = data
      },
    },
    userScoreHistory: {
      groupBy: async () => [{
        userId: 'user-1',
        _max: { scoreTotal: 10, totalDoubles: 1, totalSuperDoubles: 0 },
      }],
      findMany: async args => {
        if (args.where.roundId === 'round-2') {
          return [{ userId: 'user-1', scoreRound: -5 }]
        }
        return [{
          userId: 'user-1',
          scoreTotal: 5,
          scoreRound: -5,
          totalDoubles: 1,
          totalSuperDoubles: 0,
        }]
      },
    },
  })

  await SnapshotRankingService.execute('round-2')

  assert.equal(createdSnapshots[0].scoreTotal, 5)
  assert.equal(createdSnapshots[0].scoreRound, -5)
})

test('Mesa soma somente rodadas dentro da janela e preserva empate de posicao', async t => {
  const originalFindUnique = prisma.ranking.findUnique
  const originalBuildRows = RankingWindowScoreService.buildRows
  t.after(() => {
    prisma.ranking.findUnique = originalFindUnique
    RankingWindowScoreService.buildRows = originalBuildRows
  })

  prisma.ranking.findUnique = async () => ({
    id: 'mesa-1',
    name: 'Mesa Teste',
    description: null,
    type: 'BOLAO',
    status: 'DRAFT',
    entryFee: 0,
    startDate: new Date('2026-07-01T00:00:00Z'),
    endDate: new Date('2026-07-31T23:59:59Z'),
    maxParticipants: 50,
    currentParticipants: 3,
    createdByUserId: 'user-1',
    createdBy: { id: 'user-1', name: 'Um', nickname: null },
    participants: [
      participant('p1', 'user-1', 'Um'),
      participant('p2', 'user-2', 'Dois'),
      participant('p3', 'user-3', 'Tres'),
    ],
  })
  RankingWindowScoreService.buildRows = async () => [
    windowRow('p1', 'user-1', 8, 3, 1),
    windowRow('p2', 'user-2', 8, 3, 1),
    windowRow('p3', 'user-3', 5, 2, 3),
  ]

  const result = await GetBolaoRankingService.execute({
    rankingId: 'mesa-1',
    viewerUserId: 'user-1',
  })

  assert.deepEqual(result.entries.map(entry => entry.position), [1, 1, 3])
})

function participant(id, userId, name) {
  return {
    id,
    userId,
    score: 0,
    status: 'APPROVED',
    approvedAt: new Date('2026-07-01T00:00:00Z'),
    createdAt: new Date('2026-07-01T00:00:00Z'),
    user: { id: userId, name, nickname: null },
  }
}

function windowRow(participantId, userId, score, scoreRound, position) {
  return {
    participantId,
    userId,
    score,
    scoreRound,
    position,
    scoreInitial: 0,
    scoreTotalCurrent: score,
    previousScore: 0,
    previousPosition: null,
  }
}
