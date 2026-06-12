import { prisma } from '../../lib/prisma'

type ListAdminUsersInput = {
  page?: number
  limit?: number
  query?: string
}

export class ListAdminUsersService {
  static async execute(input: ListAdminUsersInput) {
    const page = input.page && input.page > 0 ? input.page : 1
    const limit = input.limit && input.limit > 0 && input.limit <= 100 ? input.limit : 20
    const skip = (page - 1) * limit
    const query = input.query?.trim()

    const where = query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { email: { contains: query, mode: 'insensitive' as const } },
            { nickname: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          cpf: true,
          nickname: true,
          phone: true,
          role: true,
          adminBlockedAt: true,
          adminBlockedReason: true,
          adminBlockedById: true,
          failedLoginAttempts: true,
          lockedUntil: true,
          createdAt: true,
          wallet: {
            select: {
              balance: true,
              updatedAt: true,
            },
          },
          benefitInventory: {
            select: {
              type: true,
              quantity: true,
            },
          },
          subscription: {
            select: {
              status: true,
              plan: true,
              endAt: true,
            },
          },
          UserAdminRole: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ])

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        nickname: user.nickname,
        phone: user.phone,
        role: user.role,
        adminBlockedAt: user.adminBlockedAt,
        adminBlockedReason: user.adminBlockedReason,
        adminBlockedById: user.adminBlockedById,
        failedLoginAttempts: user.failedLoginAttempts,
        lockedUntil: user.lockedUntil,
        createdAt: user.createdAt,
        wallet: user.wallet,
        benefits: {
          paidDoubles:
            user.benefitInventory.find(item => item.type === 'DOUBLE')
              ?.quantity ?? 0,
          paidSuperDoubles:
            user.benefitInventory.find(item => item.type === 'SUPER_DOUBLE')
              ?.quantity ?? 0,
        },
        subscription: user.subscription,
        adminRoles: user.UserAdminRole.map(item => item.role.name),
      })),
    }
  }
}
