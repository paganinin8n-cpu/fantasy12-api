import { prisma } from '../../lib/prisma';
import {
  Prisma,
  SubscriptionStatus,
  SubscriptionPlan,
  PaymentProvider,
} from '@prisma/client';

/**
 * Lista assinaturas para o painel ADMIN
 *
 * REGRAS:
 * - Somente leitura
 * - Paginação obrigatória
 * - Filtros opcionais
 * - Sem lógica de negócio
 * - Sem chamadas externas
 */
export interface ListAdminSubscriptionsParams {
  page?: number;
  limit?: number;
  status?: SubscriptionStatus;
  plan?: SubscriptionPlan;
  provider?: PaymentProvider;
  userId?: string;
}

export class ListAdminSubscriptionsService {
  static async execute(params: ListAdminSubscriptionsParams) {
    /**
     * 1️⃣ Paginação defensiva
     */
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 && params.limit <= 100
        ? params.limit
        : 20;

    const skip = (page - 1) * limit;

    /**
     * 2️⃣ Filtros type-safe
     */
    const where: Prisma.SubscriptionWhereInput = {
      ...(params.status && { status: params.status }),
      ...(params.plan && { plan: params.plan }),
      ...(params.provider && { provider: params.provider }),
      ...(params.userId && { userId: params.userId }),
    };

    /**
     * 3️⃣ Query transacional (count + list)
     */
    const [total, subscriptions] = await prisma.$transaction([
      prisma.subscription.count({ where }),

      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          status: true,
          plan: true,
          provider: true,
          startAt: true,
          endAt: true,
          externalSubscriptionId: true,
          externalCustomerId: true,
          createdAt: true,
          updatedAt: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    /**
     * 4️⃣ Retorno padronizado para UI ADMIN
     */
    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: subscriptions,
    };
  }
}
