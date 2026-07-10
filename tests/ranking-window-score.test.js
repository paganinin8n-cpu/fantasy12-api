const assert = require('node:assert/strict')
const test = require('node:test')

const {
  RankingWindowScoreService,
} = require('../dist/services/ranking/ranking-window-score.service')

test('calcula score de Mesa pela regra scoreTotal atual - scoreInitial', () => {
  assert.equal(
    RankingWindowScoreService.calculateScoreFromBaseline(100, 7),
    93
  )
})

test('nunca deixa score de Mesa ficar negativo quando baseline supera total atual', () => {
  assert.equal(
    RankingWindowScoreService.calculateScoreFromBaseline(7, 100),
    0
  )
})

test('Mesa considera apenas pontos feitos dentro da propria janela', async () => {
  const participant = {
    id: 'participant-1',
    userId: 'user-1',
    score: 0,
    scoreInitial: 5,
    position: null,
    approvedAt: new Date('2026-06-20T00:00:00Z'),
    createdAt: new Date('2026-06-20T00:00:00Z'),
  }
  const histories = [
    {
      userId: 'user-1',
      scoreRound: 3,
      scoreTotal: 20,
      createdAt: new Date('2026-07-05T12:00:00Z'),
      round: { closeAt: new Date('2026-07-05T12:00:00Z') },
    },
    {
      userId: 'user-1',
      scoreRound: 7,
      scoreTotal: 17,
      createdAt: new Date('2026-06-30T12:00:00Z'),
      round: { closeAt: new Date('2026-06-30T12:00:00Z') },
    },
  ]
  const db = {
    rankingParticipant: { findMany: async () => [participant] },
    userScoreHistory: { findMany: async () => histories },
  }

  const rows = await RankingWindowScoreService.buildRows(db, {
    id: 'mesa-1',
    startDate: new Date('2026-07-01T00:00:00Z'),
    endDate: new Date('2026-07-31T23:59:59Z'),
  })

  assert.equal(rows[0].score, 3)
  assert.equal(rows[0].scoreRound, 3)
})
