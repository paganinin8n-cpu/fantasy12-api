const assert = require('node:assert/strict')
const test = require('node:test')

const {
  ConsumeBenefitsService,
} = require('../dist/services/benefits/consume-benefits.service')
const { prisma } = require('../dist/lib/prisma')
const { GrantPaidBenefitService } = require('../dist/services/benefits/grant-paid-benefit.service')
const { GrantRoundBenefitsService } = require('../dist/services/benefits/grant-round-benefits.service')
const { CloseRoundService } = require('../dist/services/round/close-round.service')
const { RoundRepository } = require('../dist/repositories/round.repository')

function createTransaction({ freeDoubles = 0, freeSuperDoubles = 0, inventory = 0 } = {}) {
  const state = {
    benefit: {
      id: 'round-benefit-1',
      freeDoubles,
      freeSuperDoubles,
    },
    inventory: {
      id: 'inventory-1',
      quantity: inventory,
    },
  }

  return {
    state,
    tx: {
      roundBenefit: {
        findUnique: async () => state.benefit,
        update: async ({ data }) => {
          if (data.freeDoubles) {
            state.benefit.freeDoubles -= data.freeDoubles.decrement
          }
          if (data.freeSuperDoubles) {
            state.benefit.freeSuperDoubles -= data.freeSuperDoubles.decrement
          }
          return state.benefit
        },
      },
      userBenefitInventory: {
        findUnique: async () => state.inventory,
        update: async ({ data }) => {
          state.inventory.quantity -= data.quantity.decrement
          return state.inventory
        },
      },
    },
  }
}

test('consome primeiro as duplas grátis e completa com as pagas', async () => {
  const { tx, state } = createTransaction({ freeDoubles: 4, inventory: 3 })

  const result = await ConsumeBenefitsService.execute({
    userId: 'user-1',
    roundId: 'round-1',
    type: 'DOUBLE',
    quantity: 6,
    tx,
  })

  assert.deepEqual(result, {
    consumed: 'FREE_OR_INVENTORY',
    quantity: 6,
    freeUsed: 4,
    inventoryUsed: 2,
  })
  assert.equal(state.benefit.freeDoubles, 0)
  assert.equal(state.inventory.quantity, 1)
})

test('permite consumir estoque pago mesmo sem benefício grátis da rodada', async () => {
  const { tx, state } = createTransaction({ inventory: 2 })
  state.benefit = null

  const result = await ConsumeBenefitsService.execute({
    userId: 'user-1',
    roundId: 'round-1',
    type: 'SUPER_DOUBLE',
    quantity: 2,
    tx,
  })

  assert.equal(result.freeUsed, 0)
  assert.equal(result.inventoryUsed, 2)
  assert.equal(state.inventory.quantity, 0)
})

test('rejeita o envio quando grátis mais pagas não cobrem a quantidade', async () => {
  const { tx } = createTransaction({ freeDoubles: 2, inventory: 1 })

  await assert.rejects(
    ConsumeBenefitsService.execute({
      userId: 'user-1',
      roundId: 'round-1',
      type: 'DOUBLE',
      quantity: 4,
      tx,
    }),
    error => {
      assert.equal(error.code, 'insufficient_benefit_balance')
      assert.deepEqual(error.details, {
        type: 'DOUBLE',
        requested: 4,
        missing: 1,
      })
      return true
    }
  )
})

test('benefício pago entra no inventário permanente e sobrevive ao fechamento da rodada', async t => {
  const originalTransaction = prisma.$transaction
  const originalUpdateMany = prisma.roundBenefit.updateMany
  const originalFindById = RoundRepository.prototype.findById
  const originalUpdateStatus = RoundRepository.prototype.updateStatus
  t.after(() => {
    prisma.$transaction = originalTransaction
    prisma.roundBenefit.updateMany = originalUpdateMany
    RoundRepository.prototype.findById = originalFindById
    RoundRepository.prototype.updateStatus = originalUpdateStatus
  })

  const state = { inventory: 0, free: 2 }
  prisma.$transaction = async callback => callback({
    userBenefitInventory: {
      upsert: async ({ update, create }) => {
        state.inventory = state.inventory
          ? state.inventory + update.quantity.increment
          : create.quantity
        return { id: 'inventory-1', quantity: state.inventory }
      },
    },
    auditLog: { create: async () => ({}) },
  })
  await GrantPaidBenefitService.execute({
    userId: 'user-1', roundId: 'round-1', type: 'DOUBLE', quantity: 3,
  })

  RoundRepository.prototype.findById = async () => ({ id: 'round-1', status: 'OPEN' })
  RoundRepository.prototype.updateStatus = async () => ({ id: 'round-1', status: 'CLOSED' })
  prisma.roundBenefit.updateMany = async () => { state.free = 0; return { count: 1 } }
  await new CloseRoundService().execute('round-1')

  assert.equal(state.free, 0)
  assert.equal(state.inventory, 3)
})

test('regrant da mesma rodada não restaura benefício grátis já consumido e não carrega para outra', async t => {
  const originalFindMany = prisma.user.findMany
  const originalUpsert = prisma.roundBenefit.upsert
  t.after(() => {
    prisma.user.findMany = originalFindMany
    prisma.roundBenefit.upsert = originalUpsert
  })

  const balances = new Map()
  prisma.user.findMany = async () => [{ id: 'user-1', subscription: null }]
  prisma.roundBenefit.upsert = async ({ where, update, create }) => {
    const key = `${where.userId_roundId.userId}:${where.userId_roundId.roundId}`
    const existing = balances.get(key)
    if (!existing) {
      balances.set(key, { freeDoubles: create.freeDoubles, freeSuperDoubles: create.freeSuperDoubles })
    } else if (Object.keys(update).length > 0) {
      Object.assign(existing, update)
    }
    return balances.get(key)
  }

  await GrantRoundBenefitsService.execute('round-1')
  balances.get('user-1:round-1').freeDoubles = 1
  await GrantRoundBenefitsService.execute('round-1')
  await GrantRoundBenefitsService.execute('round-2')

  assert.equal(balances.get('user-1:round-1').freeDoubles, 1)
  assert.equal(balances.get('user-1:round-2').freeDoubles, 2)
})
