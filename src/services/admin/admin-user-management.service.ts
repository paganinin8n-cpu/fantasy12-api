import { PaymentProvider, SubscriptionPlan, SubscriptionStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { AppError } from '../../errors/AppError'

type AdminContext = {
  adminUserId: string
  ipAddress?: string
}

type ManualSubscriptionInput = {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  startAt: Date
  endAt?: Date | null
  reason: string
}

export class AdminUserManagementService {
  static async blockUser(
    context: AdminContext,
    targetUserId: string,
    reason: string
  ) {
    if (context.adminUserId === targetUserId) {
      throw AppError.badRequest(
        'Você não pode bloquear sua própria conta administrativa.',
        'cannot_block_self'
      )
    }

    const trimmedReason = reason.trim()
    if (trimmedReason.length < 3) {
      throw AppError.badRequest('Informe um motivo para o bloqueio.', 'reason_required')
    }

    return prisma.$transaction(async tx => {
      const user = await tx.user.update({
        where: { id: targetUserId },
        data: {
          adminBlockedAt: new Date(),
          adminBlockedReason: trimmedReason,
          adminBlockedById: context.adminUserId,
        },
        select: {
          id: true,
          email: true,
          role: true,
          adminBlockedAt: true,
          adminBlockedReason: true,
        },
      })

      await tx.adminAuditLog.create({
        data: {
          adminId: context.adminUserId,
          action: 'USER_BLOCKED',
          entity: 'USER',
          entityId: targetUserId,
          payload: { reason: trimmedReason },
          ipAddress: context.ipAddress,
        },
      })

      return user
    })
  }

  static async unblockUser(
    context: AdminContext,
    targetUserId: string,
    reason: string
  ) {
    const trimmedReason = reason.trim()
    if (trimmedReason.length < 3) {
      throw AppError.badRequest('Informe um motivo para a liberação.', 'reason_required')
    }

    return prisma.$transaction(async tx => {
      const previous = await tx.user.findUnique({
        where: { id: targetUserId },
        select: {
          adminBlockedAt: true,
          adminBlockedReason: true,
          adminBlockedById: true,
        },
      })

      if (!previous) throw AppError.notFound('Usuário', 'user_not_found')

      const user = await tx.user.update({
        where: { id: targetUserId },
        data: {
          adminBlockedAt: null,
          adminBlockedReason: null,
          adminBlockedById: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
        select: {
          id: true,
          email: true,
          role: true,
          adminBlockedAt: true,
          adminBlockedReason: true,
        },
      })

      await tx.adminAuditLog.create({
        data: {
          adminId: context.adminUserId,
          action: 'USER_UNBLOCKED',
          entity: 'USER',
          entityId: targetUserId,
          payload: { reason: trimmedReason, previous },
          ipAddress: context.ipAddress,
        },
      })

      return user
    })
  }

  static async setManualSubscription(
    context: AdminContext,
    targetUserId: string,
    input: ManualSubscriptionInput
  ) {
    const reason = input.reason.trim()
    if (reason.length < 3) {
      throw AppError.badRequest('Informe um motivo para a alteração do plano.', 'reason_required')
    }

    if (input.endAt && input.endAt <= input.startAt) {
      throw AppError.badRequest(
        'A data final precisa ser posterior à data inicial.',
        'invalid_subscription_period'
      )
    }

    return prisma.$transaction(async tx => {
      const target = await tx.user.findUnique({
        where: { id: targetUserId },
        select: { id: true },
      })

      if (!target) throw AppError.notFound('Usuário', 'user_not_found')

      const subscription = await tx.subscription.upsert({
        where: { userId: targetUserId },
        update: {
          plan: input.plan,
          status: input.status,
          startAt: input.startAt,
          endAt: input.endAt ?? null,
          provider: PaymentProvider.MERCADO_PAGO,
          externalSubscriptionId: null,
          externalCustomerId: null,
          packageId: null,
        },
        create: {
          userId: targetUserId,
          plan: input.plan,
          status: input.status,
          startAt: input.startAt,
          endAt: input.endAt ?? null,
          provider: PaymentProvider.MERCADO_PAGO,
        },
      })

      await tx.adminAuditLog.create({
        data: {
          adminId: context.adminUserId,
          action: 'USER_SUBSCRIPTION_SET',
          entity: 'SUBSCRIPTION',
          entityId: subscription.id,
          payload: {
            targetUserId,
            plan: input.plan,
            status: input.status,
            startAt: input.startAt.toISOString(),
            endAt: input.endAt?.toISOString() ?? null,
            reason,
          },
          ipAddress: context.ipAddress,
        },
      })

      return subscription
    })
  }

  static async cancelManualSubscription(
    context: AdminContext,
    targetUserId: string,
    reason: string
  ) {
    const trimmedReason = reason.trim()
    if (trimmedReason.length < 3) {
      throw AppError.badRequest('Informe um motivo para o cancelamento.', 'reason_required')
    }

    return prisma.$transaction(async tx => {
      const target = await tx.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, subscription: true },
      })

      if (!target) throw AppError.notFound('Usuário', 'user_not_found')
      if (!target.subscription) throw AppError.notFound('Assinatura', 'subscription_not_found')

      const subscription = await tx.subscription.update({
        where: { userId: targetUserId },
        data: {
          status: 'CANCELLED',
          endAt: new Date(),
        },
      })

      await tx.adminAuditLog.create({
        data: {
          adminId: context.adminUserId,
          action: 'USER_SUBSCRIPTION_CANCELLED',
          entity: 'SUBSCRIPTION',
          entityId: subscription.id,
          payload: { targetUserId, reason: trimmedReason },
          ipAddress: context.ipAddress,
        },
      })

      return subscription
    })
  }
}
