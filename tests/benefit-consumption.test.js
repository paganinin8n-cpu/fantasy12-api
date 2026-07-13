const assert = require('node:assert/strict')
const test = require('node:test')

const {
  ConsumeBenefitsService,
} = require('../dist/services/benefits/consume-benefits.service')

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
