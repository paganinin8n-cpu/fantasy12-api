function assertSimulationEnvironment(env = process.env) {
  if (env.NODE_ENV === 'production') {
    throw new Error('Simulacoes sao proibidas em producao')
  }
  if (env.F12_SIMULATION_CONFIRMATION !== 'local-isolated') {
    throw new Error('Confirme a simulacao com F12_SIMULATION_CONFIRMATION=local-isolated')
  }

  let databaseUrl
  try {
    databaseUrl = new URL(env.DATABASE_URL || '')
  } catch {
    throw new Error('DATABASE_URL local isolada e obrigatoria para simulacoes')
  }
  if (!['127.0.0.1', 'localhost'].includes(databaseUrl.hostname)) {
    throw new Error('Simulacoes exigem banco local isolado')
  }
}

if (require.main === module) {
  assertSimulationEnvironment()
}

module.exports = { assertSimulationEnvironment }
