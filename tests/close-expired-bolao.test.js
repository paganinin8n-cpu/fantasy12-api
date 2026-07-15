const assert = require('node:assert/strict')
const test = require('node:test')

const {
  CloseExpiredRankingsController,
} = require('../dist/controllers/internal/close-expired-rankings.controller')
const {
  CloseExpiredRankingsService,
} = require('../dist/services/ranking/close-expired-rankings.service')
const {
  InternalJobRunnerService,
} = require('../dist/services/internal/internal-job-runner.service')
const { prisma } = require('../dist/lib/prisma')

test('job canônico delega o fechamento de rankings e Mesas DRAFT expiradas', async t => {
  const originalExecute = CloseExpiredRankingsService.prototype.execute
  const originalJobExecute = InternalJobRunnerService.execute
  const originalFindMany = prisma.ranking.findMany
  t.after(() => {
    CloseExpiredRankingsService.prototype.execute = originalExecute
    InternalJobRunnerService.execute = originalJobExecute
    prisma.ranking.findMany = originalFindMany
  })

  let closeCalls = 0
  CloseExpiredRankingsService.prototype.execute = async () => {
    closeCalls += 1
    return { closed: 2 }
  }
  InternalJobRunnerService.execute = async input => ({
    executionId: 'execution-1',
    status: 'SUCCESS',
    result: await input.run(),
  })
  prisma.ranking.findMany = async () => []

  let body
  const response = { json(value) { body = value; return value } }
  await new CloseExpiredRankingsController().execute({}, response)

  assert.equal(closeCalls, 1)
  assert.equal(body.closedRankings, 2)
  assert.equal(body.execution.status, 'SUCCESS')
})
