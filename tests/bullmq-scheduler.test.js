const assert = require('node:assert/strict')
const test = require('node:test')

const {
  JOB_NAMES,
  SCHEDULER_IDS,
  SCHEDULE_TIMEZONE,
  ENSURE_MONTHLY_CRON,
  EVERY_MINUTE_MS,
} = require('../dist/jobs/constants')
const {
  getRequiredSchedules,
} = require('../dist/jobs/register-schedules')
const {
  DEFAULT_JOB_OPTIONS,
} = require('../dist/jobs/default-job-options')
const {
  listRoutableJobNames,
  processFantasy12Job,
} = require('../dist/jobs/processors/process-fantasy12-job')
const {
  loadBullmqConfig,
  summarizeRedisUrl,
} = require('../dist/jobs/config')
const {
  periodRefFromDate,
} = require('../dist/lib/period-ref')
const {
  OpenScheduledRoundsJobService,
} = require('../dist/services/jobs/open-scheduled-rounds.job.service')
const {
  CloseScheduledRoundsJobService,
} = require('../dist/services/jobs/close-scheduled-rounds.job.service')
const {
  CloseExpiredRankingsJobService,
} = require('../dist/services/jobs/close-expired-rankings.job.service')
const {
  EnsureMonthlyRankingsJobService,
} = require('../dist/services/jobs/ensure-monthly-rankings.job.service')
const {
  CloseExpiredRankingsService,
} = require('../dist/services/ranking/close-expired-rankings.service')
const {
  EnsureMonthlyRankingsService,
} = require('../dist/services/ranking/ensure-monthly-rankings.service')
const {
  InternalJobRunnerService,
} = require('../dist/services/internal/internal-job-runner.service')
const { prisma } = require('../dist/lib/prisma')
const { OpenRoundService } = require('../dist/services/round/open-round.service')
const {
  CloseRoundService,
} = require('../dist/services/round/close-round.service')

test('registra todos os schedules obrigatorios com ids deterministicos', () => {
  const schedules = getRequiredSchedules()
  const ids = schedules.map(item => item.schedulerId)
  const names = schedules.map(item => item.jobName)

  assert.deepEqual(ids.sort(), [
    SCHEDULER_IDS.CLOSE_EXPIRED_RANKINGS,
    SCHEDULER_IDS.CLOSE_SCHEDULED_ROUNDS,
    SCHEDULER_IDS.ENSURE_MONTHLY_RANKINGS,
    SCHEDULER_IDS.OPEN_SCHEDULED_ROUNDS,
    SCHEDULER_IDS.RECONCILE_MONTHLY_RANKINGS,
  ].sort())

  assert.ok(names.includes(JOB_NAMES.OPEN_SCHEDULED_ROUNDS))
  assert.ok(names.includes(JOB_NAMES.CLOSE_SCHEDULED_ROUNDS))
  assert.ok(names.includes(JOB_NAMES.CLOSE_EXPIRED_RANKINGS))
  assert.ok(names.includes(JOB_NAMES.ENSURE_MONTHLY_RANKINGS))
  assert.ok(names.includes(JOB_NAMES.RECONCILE_MONTHLY_RANKINGS))

  const monthly = schedules.find(
    item => item.schedulerId === SCHEDULER_IDS.ENSURE_MONTHLY_RANKINGS
  )
  assert.equal(monthly.pattern, ENSURE_MONTHLY_CRON)
  assert.equal(monthly.tz, SCHEDULE_TIMEZONE)

  const everyMinute = schedules.filter(item => item.everyMs === EVERY_MINUTE_MS)
  assert.equal(everyMinute.length, 3)
})

test('timezone America/Sao_Paulo deriva periodRef correto no virada do mes', () => {
  // 2026-08-01 00:30 BRT = 2026-08-01 03:30 UTC
  const brtMidnight = new Date('2026-08-01T03:30:00.000Z')
  assert.equal(periodRefFromDate(brtMidnight, 'America/Sao_Paulo'), '2026-08')

  // Still July in Sao Paulo (2026-08-01 00:30 UTC = July 31 21:30 BRT)
  const stillJuly = new Date('2026-08-01T00:30:00.000Z')
  assert.equal(periodRefFromDate(stillJuly, 'America/Sao_Paulo'), '2026-07')
})

test('retry e retencao padrao usam backoff exponencial', () => {
  assert.equal(DEFAULT_JOB_OPTIONS.attempts, 5)
  assert.equal(DEFAULT_JOB_OPTIONS.backoff.type, 'exponential')
  assert.equal(DEFAULT_JOB_OPTIONS.backoff.delay, 5000)
  assert.ok(DEFAULT_JOB_OPTIONS.removeOnComplete.count >= 1)
  assert.ok(DEFAULT_JOB_OPTIONS.removeOnFail.count >= 1)
})

test('config BullMQ valida REDIS_URL e nao exige Redis para sumarizar URL', () => {
  assert.throws(
    () => loadBullmqConfig({}),
    /REDIS_URL/
  )

  const summary = summarizeRedisUrl('redis://:s3cret@redis.internal:6379/2')
  assert.equal(summary.host, 'redis.internal')
  assert.equal(summary.port, '6379')
  assert.equal(summary.db, '2')
  assert.equal(summary.hasAuth, true)
  assert.equal(JSON.stringify(summary).includes('s3cret'), false)
})

test('roteamento job -> service cobre todos os nomes conhecidos', async t => {
  const calls = []
  const originalOpen = OpenScheduledRoundsJobService.execute
  const originalClose = CloseScheduledRoundsJobService.execute
  const originalExpired = CloseExpiredRankingsJobService.execute
  const originalMonthly = EnsureMonthlyRankingsJobService.execute

  t.after(() => {
    OpenScheduledRoundsJobService.execute = originalOpen
    CloseScheduledRoundsJobService.execute = originalClose
    CloseExpiredRankingsJobService.execute = originalExpired
    EnsureMonthlyRankingsJobService.execute = originalMonthly
  })

  OpenScheduledRoundsJobService.execute = async () => {
    calls.push('open')
    return { opened: 0, skipped: 0 }
  }
  CloseScheduledRoundsJobService.execute = async () => {
    calls.push('close')
    return { closed: 0, skipped: 0, executions: [] }
  }
  CloseExpiredRankingsJobService.execute = async () => {
    calls.push('expired')
    return { closedRankings: 0, execution: { id: '1', status: 'SUCCESS' } }
  }
  EnsureMonthlyRankingsJobService.execute = async input => {
    calls.push(`monthly:${input?.source || 'schedule'}`)
    return {
      periodRef: '2026-07',
      registrationOpen: false,
      firstRoundId: null,
      generalAdded: 0,
      proAdded: 0,
      execution: { id: '1', status: 'SUCCESS' },
    }
  }

  for (const name of listRoutableJobNames()) {
    await processFantasy12Job({ name, id: 'job-1', attemptsMade: 0 })
  }

  assert.deepEqual(calls.sort(), [
    'close',
    'expired',
    'monthly:reconcile',
    'monthly:schedule',
    'open',
  ].sort())
})

test('abertura agendada nao abre nada quando nao ha rodada devida', async t => {
  const originalFindFirst = prisma.round.findFirst
  t.after(() => {
    prisma.round.findFirst = originalFindFirst
  })

  let calls = 0
  prisma.round.findFirst = async () => {
    calls += 1
    return null
  }

  const result = await OpenScheduledRoundsJobService.execute(new Date())
  assert.equal(result.opened, 0)
  assert.equal(result.skipped, 0)
  assert.equal(calls, 2) // already-open check + due draft lookup
})

test('abertura agendada respeita uma unica rodada OPEN', async t => {
  const originalFindFirst = prisma.round.findFirst
  const originalOpen = OpenRoundService.execute
  t.after(() => {
    prisma.round.findFirst = originalFindFirst
    OpenRoundService.execute = originalOpen
  })

  OpenRoundService.execute = async () => {
    throw new Error('should not open')
  }
  prisma.round.findFirst = async () => ({ id: 'open-1', number: 10 })

  const result = await OpenScheduledRoundsJobService.execute(new Date())
  assert.equal(result.opened, 0)
  assert.equal(result.skipped, 1)
  assert.equal(result.reason, 'round_already_open')
})

test('fechamento agendada e idempotente quando nao ha OPEN vencida', async t => {
  const originalFindMany = prisma.round.findMany
  t.after(() => {
    prisma.round.findMany = originalFindMany
  })

  prisma.round.findMany = async () => []
  const result = await CloseScheduledRoundsJobService.execute(new Date())
  assert.equal(result.closed, 0)
  assert.equal(result.skipped, 0)
  assert.deepEqual(result.executions, [])
})

test('fechamento agendada delega CloseRoundService por rodada', async t => {
  const originalFindMany = prisma.round.findMany
  const originalJob = InternalJobRunnerService.execute
  const originalClose = CloseRoundService.prototype.execute
  const originalEnsure = EnsureMonthlyRankingsService.execute
  t.after(() => {
    prisma.round.findMany = originalFindMany
    InternalJobRunnerService.execute = originalJob
    CloseRoundService.prototype.execute = originalClose
    EnsureMonthlyRankingsService.execute = originalEnsure
  })

  prisma.round.findMany = async () => [
    { id: 'r1', number: 1, closeAt: new Date('2026-07-01T12:00:00.000Z') },
  ]

  let closed = 0
  EnsureMonthlyRankingsService.execute = async () => ({
    periodRef: '2026-07',
    registrationOpen: false,
    firstRoundId: null,
    generalAdded: 0,
    proAdded: 0,
  })
  CloseRoundService.prototype.execute = async id => {
    closed += 1
    assert.equal(id, 'r1')
  }
  InternalJobRunnerService.execute = async input => ({
    executionId: 'exec-1',
    status: 'SUCCESS',
    result: await input.run(),
  })

  const result = await CloseScheduledRoundsJobService.execute(new Date())
  assert.equal(closed, 1)
  assert.equal(result.closed, 1)
})
test('close expired Mesas delega service e permite repeat sem duplicar settlement de dominio', async t => {
  const originalJob = InternalJobRunnerService.execute
  const originalClose = CloseExpiredRankingsService.prototype.execute
  t.after(() => {
    InternalJobRunnerService.execute = originalJob
    CloseExpiredRankingsService.prototype.execute = originalClose
  })

  let domainCalls = 0
  CloseExpiredRankingsService.prototype.execute = async () => {
    domainCalls += 1
    return { closed: 1 }
  }

  let allowRepeat
  InternalJobRunnerService.execute = async input => {
    allowRepeat = input.allowRepeat
    return {
      executionId: 'exec-expired',
      status: 'SUCCESS',
      result: await input.run(),
    }
  }

  const first = await CloseExpiredRankingsJobService.execute()
  const second = await CloseExpiredRankingsJobService.execute()

  assert.equal(allowRepeat, true)
  assert.equal(domainCalls, 2)
  assert.equal(first.closedRankings, 1)
  assert.equal(second.closedRankings, 1)
})

test('recuperacao mensal usa source reconcile e chama EnsureMonthlyRankingsService', async t => {
  const originalJob = InternalJobRunnerService.execute
  const originalEnsure = EnsureMonthlyRankingsService.execute
  t.after(() => {
    InternalJobRunnerService.execute = originalJob
    EnsureMonthlyRankingsService.execute = originalEnsure
  })

  let seen
  EnsureMonthlyRankingsService.execute = async input => {
    seen = input
    return {
      periodRef: input.periodRef,
      registrationOpen: false,
      firstRoundId: null,
      generalAdded: 0,
      proAdded: 0,
    }
  }
  InternalJobRunnerService.execute = async input => ({
    executionId: 'exec-month',
    status: 'SUCCESS',
    result: await input.run(),
  })

  const result = await EnsureMonthlyRankingsJobService.execute({
    now: new Date('2026-07-15T12:00:00.000Z'),
    source: 'reconcile',
  })

  assert.equal(seen.periodRef, '2026-07')
  assert.equal(result.periodRef, '2026-07')
  assert.equal(result.execution.status, 'SUCCESS')
})

test('processador rejeita job desconhecido sem vazar secrets', async () => {
  await assert.rejects(
    () => processFantasy12Job({ name: 'unknown-job', id: 'x', attemptsMade: 1 }),
    /Unknown Fantasy12 job name/
  )
})
