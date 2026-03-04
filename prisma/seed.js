const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10)

  const user = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@fantasy12.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  })

  const adminRole = await prisma.adminRole.findUnique({
    where: { name: 'ADMIN' }
  })

  if (adminRole) {
    await prisma.userAdminRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id
      }
    })
  }

  console.log('Seed executado com sucesso')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })