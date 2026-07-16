const assert = require('node:assert/strict')
const test = require('node:test')

const { OfficialRoundScheduleService } = require('../dist/services/round/official-round-schedule.service')
const { SaoPauloPeriodService } = require('../dist/services/time/sao-paulo-period.service')
const { MesaIntegrityService } = require('../dist/services/bolao/mesa-integrity.service')

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

test('calendário oficial exige os 12 horários e quarta ou sábado', () => {
  const missing = matches('2026-07-15T19:00:00-03:00')
  missing[4].matchTime = null
  assert.throws(() => OfficialRoundScheduleService.derive(missing), /horário dos 12 jogos/i)
  assert.throws(
    () => OfficialRoundScheduleService.derive(matches('2026-07-16T19:00:00-03:00')),
    /quarta-feira ou sábado/i
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
    id: 'mesa-1', description: ' ', entryFee: 10, prizeDistribution: null,
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

