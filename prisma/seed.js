const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🔹 Seeding Admin User')

  const passwordHash = await bcrypt.hash('123456', 10)

  const user = await prisma.user.upsert({
    where: { email: 'admin@fantasy12.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@fantasy12.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  })

  const adminRole = await prisma.adminRole.findUnique({
    where: { name: 'ADMIN' }
  })

  if (!adminRole) {
    throw new Error('AdminRole ADMIN não encontrada. Rode seed-admin-permissions primeiro.')
  }

  await prisma.userAdminRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: adminRole.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      roleId: adminRole.id
    }
  })

  console.log('✅ Admin user seed concluído')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())