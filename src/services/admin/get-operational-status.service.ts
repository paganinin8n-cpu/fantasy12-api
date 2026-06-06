import { prisma } from '../../lib/prisma'
import { AlertDispatcherService } from '../alerts/alert-dispatcher.service'

function minutesSince(value: Date | null) {
  if (!value) return null
  return Math.floor((Date.now() - value.getTime()) / 60000)
}

export class GetOperationalStatusService {
  static async execute() {
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [
      lastPayment,
      pendingPayments,
      stalePendingPayments,
      approvedNotCredited,
      lastWebhook,
      webhooksLast5m,
      webhooksLast24h,
      activeSubscriptions,
      activeSubscriptionsPastEnd,
      expiringSubscriptions7d,
      openRound,
      lastInternalJob,
      failedJobs24h,
      runningJobsOver30m,
    ] = await Promise.all([
      prisma.payment.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, createdAt: true },
      }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({
        where: {
          status: 'PENDING',
          createdAt: { lt: thirtyMinutesAgo },
        },
      }),
      prisma.payment.count({
        where: {
          status: 'APPROVED',
          isCredited: false,
        },
      }),
      prisma.paymentWebhookEvent.findFirst({
        orderBy: { receivedAt: 'desc' },
        select: { id: true, provider: true, receivedAt: true },
      }),
      prisma.paymentWebhookEvent.count({
        where: { receivedAt: { gte: fiveMinutesAgo } },
      }),
      prisma.paymentWebhookEvent.count({
        where: { receivedAt: { gte: twentyFourHoursAgo } },
      }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          endAt: { lt: now },
        },
      }),
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          endAt: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.round.findFirst({
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, number: true, openAt: true },
      }),
      prisma.internalJobExecution.findFirst({
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          jobName: true,
          referenceId: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          error: true,
        },
      }),
      prisma.internalJobExecution.count({
        where: {
          status: 'FAILED',
          startedAt: { gte: twentyFourHoursAgo },
        },
      }),
      prisma.internalJobExecution.count({
        where: {
          status: 'RUNNING',
          startedAt: { lt: thirtyMinutesAgo },
        },
      }),
    ])

    const criticalIssues = [
      approvedNotCredited > 0 ? 'approved_payment_not_credited' : null,
      activeSubscriptionsPastEnd > 0 ? 'active_subscription_past_end' : null,
      failedJobs24h > 0 ? 'internal_job_failed_last_24h' : null,
      runningJobsOver30m > 0 ? 'internal_job_stuck_over_30m' : null,
      !process.env.MP_ACCESS_TOKEN ? 'mp_access_token_missing' : null,
    ].filter(Boolean)

    const warnings = [
      stalePendingPayments > 0 ? 'stale_pending_payments' : null,
      webhooksLast5m > 100 ? 'webhook_high_volume' : null,
      !process.env.MP_WEBHOOK_SECRET &&
      process.env.MP_ALLOW_UNSIGNED_TEST_WEBHOOKS !== 'true'
        ? 'mp_webhook_secret_missing'
        : null,
      !process.env.API_PUBLIC_URL && !process.env.MP_NOTIFICATION_URL
        ? 'mp_notification_url_not_explicit'
        : null,
    ].filter(Boolean)

    return {
      generatedAt: now.toISOString(),
      status:
        criticalIssues.length > 0
          ? 'CRITICAL'
          : warnings.length > 0
            ? 'WARN'
            : 'OK',
      criticalIssues,
      warnings,
      configuration: {
        mercadoPagoCheckoutEnabled: Boolean(process.env.MP_ACCESS_TOKEN),
        mercadoPagoWebhookSecretConfigured: Boolean(process.env.MP_WEBHOOK_SECRET),
        mercadoPagoUnsignedTestWebhooksEnabled:
          process.env.MP_ALLOW_UNSIGNED_TEST_WEBHOOKS === 'true' &&
          process.env.MP_ACCESS_TOKEN?.startsWith('TEST-'),
        mercadoPagoNotificationUrlConfigured: Boolean(
          process.env.MP_NOTIFICATION_URL || process.env.API_PUBLIC_URL
        ),
        operationsAlertWebhookConfigured:
          AlertDispatcherService.isExternalConfigured(),
      },
      payments: {
        pending: pendingPayments,
        stalePending: stalePendingPayments,
        approvedNotCredited,
        lastPayment: lastPayment
          ? {
              id: lastPayment.id,
              status: lastPayment.status,
              createdAt: lastPayment.createdAt.toISOString(),
              minutesAgo: minutesSince(lastPayment.createdAt),
            }
          : null,
      },
      webhooks: {
        last24h: webhooksLast24h,
        last5m: webhooksLast5m,
        lastReceived: lastWebhook
          ? {
              id: lastWebhook.id,
              provider: lastWebhook.provider,
              receivedAt: lastWebhook.receivedAt.toISOString(),
              minutesAgo: minutesSince(lastWebhook.receivedAt),
            }
          : null,
      },
      subscriptions: {
        active: activeSubscriptions,
        activePastEnd: activeSubscriptionsPastEnd,
        expiringIn7d: expiringSubscriptions7d,
      },
      rounds: {
        open: openRound
          ? {
              id: openRound.id,
              number: openRound.number,
              openedAt: openRound.openAt?.toISOString() ?? null,
            }
          : null,
      },
      jobs: {
        failedLast24h: failedJobs24h,
        runningOver30m: runningJobsOver30m,
        lastExecution: lastInternalJob
          ? {
              id: lastInternalJob.id,
              jobName: lastInternalJob.jobName,
              referenceId: lastInternalJob.referenceId,
              status: lastInternalJob.status,
              startedAt: lastInternalJob.startedAt.toISOString(),
              finishedAt: lastInternalJob.finishedAt?.toISOString() ?? null,
              minutesAgo: minutesSince(lastInternalJob.startedAt),
              error: lastInternalJob.error,
            }
          : null,
      },
      runbook: [
        {
          key: 'payments',
          title: 'Pagamentos aprovados sem crédito',
          trigger: 'approved_payment_not_credited',
          action:
            'Conferir /api/admin/operational/status, localizar paymentId em logs e reprocessar crédito somente após validar isCredited=false.',
        },
        {
          key: 'webhooks',
          title: 'Falha ou volume anormal de webhooks',
          trigger: 'webhook_high_volume ou ausência de lastReceived',
          action:
            'Validar MP_WEBHOOK_SECRET, URL cadastrada no Mercado Pago e eventos recentes em payment_webhook_events.',
        },
        {
          key: 'jobs',
          title: 'Job interno travado ou falhou',
          trigger: 'internal_job_failed_last_24h ou internal_job_stuck_over_30m',
          action:
            'Executar /internal/jobs/alerts/run com x-internal-job-token, revisar InternalJobExecution e repetir apenas jobs idempotentes.',
        },
      ],
    }
  }
}
