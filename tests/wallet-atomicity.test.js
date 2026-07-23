const assert = require('node:assert/strict')
const test = require('node:test')

const { WalletService } = require('../dist/services/wallet/wallet.service')

function createTx({ conditionalUpdateCount }) {
  const calls = []
  const tx = {
    wallet: {
      findUnique: async () => ({ id: 'wallet-1', userId: 'user-1', balance: 10 }),
      updateMany: async args => {
        calls.push({ operation: 'wallet.updateMany', args })
        return { count: conditionalUpdateCount }
      },
    },
    walletLedger: {
      create: async args => {
        calls.push({ operation: 'walletLedger.create', args })
        return { id: 'ledger-1' }
      },
    },
  }
  return { tx, calls }
}

test('debito usa update condicional ao saldo e grava ledger somente depois', async () => {
  const { tx, calls } = createTx({ conditionalUpdateCount: 1 })

  await WalletService.debit('user-1', 10, 'Compra', tx)

  assert.deepEqual(calls.map(call => call.operation), [
    'wallet.updateMany',
    'walletLedger.create',
  ])
  assert.deepEqual(calls[0].args.where, {
    id: 'wallet-1',
    balance: { gte: 10 },
  })
  assert.deepEqual(calls[0].args.data, { balance: { decrement: 10 } })
})

test('debito concorrente perdido nao grava ledger nem deixa operacao prosseguir', async () => {
  const { tx, calls } = createTx({ conditionalUpdateCount: 0 })

  await assert.rejects(
    WalletService.debit('user-1', 10, 'Compra', tx),
    error => error?.code === 'insufficient_wallet_balance'
  )

  assert.deepEqual(calls.map(call => call.operation), ['wallet.updateMany'])
})

test('debito rejeita valores nao inteiros, negativos e zero', async () => {
  const { tx, calls } = createTx({ conditionalUpdateCount: 1 })

  for (const amount of [0, -1, 1.5, Number.NaN]) {
    await assert.rejects(
      WalletService.debit('user-1', amount, 'Compra', tx),
      error => error?.code === 'invalid_wallet_amount'
    )
  }

  assert.deepEqual(calls, [])
})
