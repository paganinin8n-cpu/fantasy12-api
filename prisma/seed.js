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

  console.log('🔹 Seeding Payment Packages')

  const packages = [
    {
      id: 'coins_100',
      label: 'Pack 100 Fichas',
      coinsAmount: 100,
      bonusCoins: 0,
      amountCents: 5000,
    },
    {
      id: 'coins_250_bonus_25',
      label: 'Pack 250 Fichas + 25 Bonus',
      coinsAmount: 250,
      bonusCoins: 25,
      amountCents: 10000,
    },
    {
      id: 'coins_500_bonus_75',
      label: 'Pack 500 Fichas + 75 Bonus',
      coinsAmount: 500,
      bonusCoins: 75,
      amountCents: 18000,
    },
  ]

  for (const pkg of packages) {
    await prisma.paymentPackage.upsert({
      where: { id: pkg.id },
      update: {
        label: pkg.label,
        coinsAmount: pkg.coinsAmount,
        bonusCoins: pkg.bonusCoins,
        amountCents: pkg.amountCents,
        isActive: true,
      },
      create: {
        ...pkg,
        isActive: true,
      },
    })
  }

  console.log('✅ Payment packages seed concluído')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
