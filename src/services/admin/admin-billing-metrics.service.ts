import { prisma } from '../../lib/prisma';
import {
  PaymentStatus,
  WalletTransactionType,
  SubscriptionStatus,
  SubscriptionPlan,
} from '@prisma/client';

/**
 * Service — Métricas de Billing (ADMIN)
 *
 * REGRAS:
 * - SOMENTE LEITURA
 * - Nenhuma escrita em banco
 * - Nenhuma alteração de estado
 * - Nenhuma regra de negócio
 * - Métricas agregadas para operação
 */
export class AdminBillingMetricsService {
  static async execute() {
    /**
     * ======================
     * PAGAMENTOS
     * ======================
     */
    const [
      totalPayments,
      approvedPayments,
      rejectedPayments,
      pendingPayments,
      revenue,
    ] = await prisma.$transaction([
      prisma.payment.count(),
      prisma.payment.count({
        where: { status: PaymentStatus.APPROVED },
      }),
      prisma.payment.count({
        where: { status: PaymentStatus.REJECTED },
      }),
      prisma.payment.count({
        where: { status: PaymentStatus.PENDING },
      }),
      prisma.payment.aggregate({
        where: { status: PaymentStatus.APPROVED },
        _sum: { amountCents: true },
      }),
    ]);

    /**
     * ======================
     * WALLET (COINS CREDITADAS)
     * ======================
     */
    const totalCoinsCredited = await prisma.walletLedger.aggregate({
      where: { type: WalletTransactionType.CREDIT },
      _sum: { amount: true },
    });

    /**
     * ======================
     * ASSINATURAS
     * ======================
     */
    const [
      activeSubscriptions,
      cancelledSubscriptions,
      expiredSubscriptions,
      monthlySubscriptions,
      annualSubscriptions,
    ] = await prisma.$transaction([
      prisma.subscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      prisma.subscription.count({
        where: { status: SubscriptionStatus.CANCELLED },
      }),
      prisma.subscription.count({
        where: { status: SubscriptionStatus.EXPIRED },
      }),
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
          plan: SubscriptionPlan.MONTHLY,
        },
      }),
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
          plan: SubscriptionPlan.ANNUAL,
        },
      }),
    ]);

    /**
     * ======================
     * MRR ESTIMADO
     * ======================
     *
     * Regra:
     * - MONTHLY = 1x
     * - ANNUAL = dividido por 12
     *
     * ⚠️ Valores monetários reais podem variar
     * ⚠️ Métrica é ESTIMADA (operacional)
     */
    const monthlyMRR = monthlySubscriptions;
    const annualMRR = annualSubscriptions / 12;

    return {
      payments: {
        total: totalPayments,
        approved: approvedPayments,
        rejected: rejectedPayments,
        pending: pendingPayments,
        revenueCents: revenue._sum.amountCents ?? 0,
      },

      wallet: {
        totalCoinsCredited: totalCoinsCredited._sum.amount ?? 0,
      },

      subscriptions: {
        active: activeSubscriptions,
        cancelled: cancelledSubscriptions,
        expired: expiredSubscriptions,
        byPlan: {
          monthly: monthlySubscriptions,
          annual: annualSubscriptions,
        },
      },

      mrr: {
        monthlyEstimated: monthlyMRR,
        annualEstimated: annualMRR,
      },
    };
  }
}
