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
