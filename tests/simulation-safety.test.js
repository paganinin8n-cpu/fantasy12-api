const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const {
  assertSimulationEnvironment,
} = require('../scripts/simulation-environment-guard')

test('simulacao recusa ambiente de producao mesmo com banco local', () => {
  assert.throws(
    () => assertSimulationEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:secret@localhost:5432/f12',
    }),
    /Simulacoes sao proibidas em producao/
  )
})

test('simulacao recusa banco remoto fora de producao', () => {
  assert.throws(
    () => assertSimulationEnvironment({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://user:secret@database.internal:5432/f12',
    }),
    /banco local isolado/
  )
})

test('simulacao aceita somente confirmacao explicita e banco local', () => {
  assert.doesNotThrow(() => assertSimulationEnvironment({
    NODE_ENV: 'test',
    F12_SIMULATION_CONFIRMATION: 'local-isolated',
    DATABASE_URL: 'postgresql://user:secret@127.0.0.1:5432/f12_simulation',
  }))
})

test('workflow de producao nao oferece nem executa SIMULATE', () => {
  const workflow = fs.readFileSync(
    path.join(__dirname, '../.github/workflows/simulate-competition.yml'),
    'utf8'
  )

  assert.doesNotMatch(workflow, /inputs\.confirmation\s*==\s*'SIMULATE'/)
  assert.doesNotMatch(workflow, /node \/app\/scripts\/simulate-competition\.js/)
})
