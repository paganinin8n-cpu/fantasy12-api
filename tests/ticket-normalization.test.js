const assert = require('node:assert/strict')
const test = require('node:test')

const { prisma } = require('../dist/lib/prisma')
const { CreateTicketSchema } = require('../dist/validators/ticket.validator')
const { CreateTicketService } = require('../dist/services/ticket/create-ticket.service')

const rawPrediction = [' x ', ...Array(11).fill(' 1 ')].join(',')
const normalizedPrediction = ['X', ...Array(11).fill('1')].join(',')

test('validador normaliza palpites com trim e uppercase', () => {
  const parsed = CreateTicketSchema.parse({
    roundId: 'round-1', prediction: rawPrediction, multipliers: Array(12).fill(1),
  })
  assert.equal(parsed.prediction, normalizedPrediction)
})

test('servico persiste somente a forma canonica do palpite', async t => {
  const originalTransaction = prisma.$transaction
  t.after(() => { prisma.$transaction = originalTransaction })
  let persisted = null

  prisma.$transaction = async callback => callback({
    round: { findUnique: async () => ({
      status: 'OPEN', openAt: new Date('2026-01-01T00:00:00Z'),
      closeAt: new Date('2099-01-01T00:00:00Z'),
    }) },
    ticket: {
      findUnique: async () => null,
      create: async ({ data }) => {
        persisted = data
        return { id: 'ticket-1', roundId: data.roundId, createdAt: new Date() }
      },
    },
    auditLog: { create: async () => ({}) },
  })

  await CreateTicketService.execute({
    userId: 'user-1', roundId: 'round-1', prediction: rawPrediction,
    multipliers: Array(12).fill(1),
  })
  assert.equal(persisted.prediction, normalizedPrediction)
})
