import { z } from 'zod'

/**
 * Schema de criação de ticket.
 *
 * Regras:
 * - prediction: string CSV com exatamente 12 valores (1, X ou 2)
 * - multipliers: array com exatamente 12 inteiros, cada um deve ser 1, 2 ou 4
 *   (1 = simples, 2 = dupla, 4 = super dupla)
 */
export const CreateTicketSchema = z.object({
  roundId: z.string().min(1, 'roundId é obrigatório'),
  prediction: z
    .string()
    .min(1, 'prediction é obrigatório')
    .refine(
      value => value.split(',').length === 12,
      { message: 'prediction deve ter exatamente 12 jogos separados por vírgula' }
    )
    .refine(
      value =>
        value
          .split(',')
          .every(p => ['1', 'X', '2', 'x'].includes(p.trim())),
      { message: 'cada palpite deve ser 1, X ou 2' }
    ),
  multipliers: z
    .array(z.number().int().refine(n => [1, 2, 4].includes(n), {
      message: 'multiplicador deve ser 1, 2 ou 4',
    }))
    .length(12, 'multipliers deve ter exatamente 12 posições'),
})

export type CreateTicketDTO = z.infer<typeof CreateTicketSchema>
