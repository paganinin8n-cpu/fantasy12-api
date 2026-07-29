const assert = require('node:assert/strict')
const test = require('node:test')

const {
  RANKING_TIEBREAK_RULE_VERSION,
  RankingTiebreakService,
} = require('../dist/services/ranking/ranking-tiebreak.service')

function row({
  userId,
  scoreRanking = 10,
  superDoubleHits = 0,
  doubleHits = 0,
  userCreatedAt = '2026-01-01T00:00:00Z',
}) {
  return {
    userId,
    scoreRanking,
    superDoubleHits,
    doubleHits,
    userCreatedAt: new Date(userCreatedAt),
  }
}

test('expõe a versão oficial da regra de desempate', () => {
  assert.equal(RANKING_TIEBREAK_RULE_VERSION, 'v2')
})

test('ordena por score, Super Duplas, Duplas e conta mais antiga', () => {
  const ranked = RankingTiebreakService.rank([
    row({ userId: 'menor-score', scoreRanking: 9, superDoubleHits: 99 }),
    row({ userId: 'menos-super', superDoubleHits: 1, doubleHits: 99 }),
    row({ userId: 'mais-novo', superDoubleHits: 2, doubleHits: 3, userCreatedAt: '2026-02-01T00:00:00Z' }),
    row({ userId: 'mais-antigo', superDoubleHits: 2, doubleHits: 3, userCreatedAt: '2025-01-01T00:00:00Z' }),
    row({ userId: 'menos-duplas', superDoubleHits: 2, doubleHits: 2 }),
  ], item => item)

  assert.deepEqual(
    ranked.map(item => item.userId),
    ['mais-antigo', 'mais-novo', 'menos-duplas', 'menos-super', 'menor-score']
  )
  assert.deepEqual(
    ranked.map(item => item.position),
    [1, 2, 3, 4, 5]
  )
})

test('userId estabiliza a ordem sem desfazer empate absoluto', () => {
  const ranked = RankingTiebreakService.rank([
    row({ userId: 'user-b' }),
    row({ userId: 'user-a' }),
  ], item => item)

  assert.deepEqual(
    ranked.map(item => ({ userId: item.userId, position: item.position })),
    [
      { userId: 'user-a', position: 1 },
      { userId: 'user-b', position: 1 },
    ]
  )
})

test('calcula acertos somente dentro da janela do ranking', () => {
  assert.deepEqual(
    RankingTiebreakService.calculateWindowHits(
      { totalSuperDoubles: 8, totalDoubles: 13 },
      { totalSuperDoubles: 5, totalDoubles: 7 }
    ),
    {
      superDoubleHits: 3,
      doubleHits: 6,
    }
  )
})

test('sem histórico anterior, o baseline de acertos é zero', () => {
  assert.deepEqual(
    RankingTiebreakService.calculateWindowHits(
      { totalSuperDoubles: 2, totalDoubles: 4 },
      null
    ),
    {
      superDoubleHits: 2,
      doubleHits: 4,
    }
  )
})
