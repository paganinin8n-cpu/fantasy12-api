import { z } from 'zod'

export const UuidSchema = z.uuid('identificador deve ser um UUID válido')
export const UuidIdParamsSchema = z.object({ id: UuidSchema }).strict()
export const UserIdParamsSchema = z.object({ userId: UuidSchema }).strict()
export const RoundIdParamsSchema = z.object({ roundId: UuidSchema }).strict()
export const RankingIdParamsSchema = z.object({ rankingId: UuidSchema }).strict()
