const assert = require('node:assert/strict')
const Module = require('node:module')
const test = require('node:test')

test('regrant preserves benefits already consumed in the open round', async () => {
  const scriptPath = require.resolve('../scripts/regrant-open-round-benefits.js')
  const originalLoad = Module._load
  const existingBenefit = {
    userId: 'user-1',
    roundId: 'round-1',
    freeDoubles: 1,
    freeSuperDoubles: 0,
  }

  let resolveDisconnected
  const disconnected = new Promise(resolve => {
    resolveDisconnected = resolve
  })

  class FakePrismaClient {
    round = {
      findFirst: async () => ({ id: 'round-1', number: 1 }),
    }

    user = {
      findMany: async () => [{ id: 'user-1', subscription: null }],
    }

    roundBenefit = {
      upsert: async ({ update }) => {
        Object.assign(existingBenefit, update)
        return existingBenefit
      },
    }

    $disconnect = async () => resolveDisconnected()
  }

  Module._load = function (request, parent, isMain) {
    if (request === '@prisma/client') return { PrismaClient: FakePrismaClient }
    return originalLoad.call(this, request, parent, isMain)
  }

  try {
    delete require.cache[scriptPath]
    require(scriptPath)
    await disconnected

    assert.equal(existingBenefit.freeDoubles, 1)
    assert.equal(existingBenefit.freeSuperDoubles, 0)
  } finally {
    Module._load = originalLoad
    delete require.cache[scriptPath]
  }
})
