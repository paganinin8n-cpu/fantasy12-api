const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const permissions = [
  'COMPETITION_READ',
  'COMPETITION_WRITE',
  'COMPETITION_EXECUTE',
  'COMPETITION_FORCE',
  'RANKING_READ',
  'RANKING_REBUILD',
  'RANKING_FORCE',
  'FINANCE_READ',
  'FINANCE_WRITE',
  'FINANCE_EXECUTE',
  'FINANCE_FORCE',
  'USER_READ',
  'USER_WRITE',
  'USER_FORCE',
  'AUDIT_READ',
  'SYSTEM_LOCK',
  'SYSTEM_REBUILD',
  'SYSTEM_FORCE',
  'JOB_EXECUTE',
  'JOB_FORCE'
]

async function main() {
  console.log('🔹 Seeding Admin Permissions')

  for (const code of permissions) {
    await prisma.adminPermission.upsert({
      where: { code },
      update: {},
      create: { code }
    })
  }

  const adminRole = await prisma.adminRole.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrador Operacional'
    }
  })

  const superAdminRole = await prisma.adminRole.upsert({
    where: { name: 'SUPERADMIN' },
    update: {},
    create: {
      name: 'SUPERADMIN',
      description: 'Administrador Máximo'
    }
  })

  const allPermissions = await prisma.adminPermission.findMany()

  const adminAllowed = [
    'COMPETITION_READ',
    'COMPETITION_WRITE',
    'COMPETITION_EXECUTE',
    'RANKING_READ',
    'FINANCE_READ',
    'USER_READ',
    'USER_WRITE',
    'AUDIT_READ',
    'JOB_EXECUTE'
  ]

  for (const perm of allPermissions) {
    if (adminAllowed.includes(perm.code)) {
      await prisma.adminRolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: perm.id
          }
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: perm.id
        }
      })
    }
  }

  for (const perm of allPermissions) {
    await prisma.adminRolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id
        }
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: perm.id
      }
    })
  }

  console.log('✅ Admin permissions seed concluído')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())