const assert = require('node:assert/strict')
const test = require('node:test')

const {
  assertCleanupConfirmation,
  isSafeSimulationRound,
  isSimulationIdentity,
} = require('../scripts/cleanup-simulation-data')

test('identifica somente contas marcadas como simulacao', () => {
  assert.equal(isSimulationIdentity({
    name: '[SIM 20260710030052] creator',
    email: 'sim-creator@simulation.fantasy12.test',
  }), true)
  assert.equal(isSimulationIdentity({
    name: '[SCORETEST 20260729] Alpha',
    email: 'alpha@example.com',
  }), true)
  assert.equal(isSimulationIdentity({
    name: 'Simone Silva',
    email: 'simone@example.com',
  }), false)
})

test('apply exige confirmacao destrutiva exata', () => {
  assert.throws(
    () => assertCleanupConfirmation(true, {}),
    /DELETE_SIMULATION_DATA/
  )
  assert.doesNotThrow(() => assertCleanupConfirmation(true, {
    F12_SIMULATION_CLEANUP_CONFIRMATION: 'DELETE_SIMULATION_DATA',
  }))
})

test('rodada so pode ser removida quando todas as referencias pertencem a simulacao', () => {
  const simulationIds = new Set(['sim-a', 'sim-b'])
  const safe = {
    tickets: [{ userId: 'sim-a' }],
    scoreHistory: [{ userId: 'sim-a' }],
    rankingSnapshots: [{ userId: 'sim-b' }],
    roundBenefits: [],
    matches: [],
  }
  assert.equal(isSafeSimulationRound(safe, simulationIds), true)
  assert.equal(isSafeSimulationRound({
    ...safe,
    scoreHistory: [...safe.scoreHistory, { userId: 'real-user' }],
  }, simulationIds), false)
  assert.equal(isSafeSimulationRound({
    ...safe,
    rankingSnapshots: [{ userId: 'real-user' }],
  }, simulationIds), true)
  assert.equal(isSafeSimulationRound({ ...safe, matches: [{ id: 'match-1' }] }, simulationIds), false)
})
