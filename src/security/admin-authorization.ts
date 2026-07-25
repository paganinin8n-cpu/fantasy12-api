import { prisma } from '../lib/prisma'
import type { AdminPermissionCode } from '../domain/permissions'

export async function hasAdminPermission(
  userId: string,
  permissionCode: AdminPermissionCode
): Promise<boolean> {
  const assignment = await prisma.userAdminRole.findFirst({
    where: {
      userId,
      role: {
        OR: [
          { name: 'SUPERADMIN' },
          {
            permissions: {
              some: { permission: { code: permissionCode } },
            },
          },
        ],
      },
    },
    select: { id: true },
  })

  return Boolean(assignment)
}
