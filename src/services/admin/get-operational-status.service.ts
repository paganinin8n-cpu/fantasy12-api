import { prisma } from '../../lib/prisma'

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
    ])

    const criticalIssues = [
      approvedNotCredited > 0 ? 'approved_payment_not_credited' : null,
      activeSubscriptionsPastEnd > 0 ? 'active_subscription_past_end' : null,
      !process.env.MP_ACCESS_TOKEN ? 'mp_access_token_missing' : null,
    ].filter(Boolean)

    const warnings = [
      stalePendingPayments > 0 ? 'stale_pending_payments' : null,
      webhooksLast5m > 100 ? 'webhook_high_volume' : null,
      !process.env.MP_WEBHOOK_SECRET ? 'mp_webhook_secret_missing' : null,
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
        mercadoPagoNotificationUrlConfigured: Boolean(
          process.env.MP_NOTIFICATION_URL || process.env.API_PUBLIC_URL
        ),
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
    }
  }
}
