import { z } from 'zod'

export const AdminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  query: z.string().trim().max(120).optional(),
}).strict()

export const AdminSubscriptionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']).optional(),
  plan: z.enum(['MONTHLY', 'ANNUAL']).optional(),
  provider: z.enum(['MERCADO_PAGO']).optional(),
  userId: z.uuid().optional(),
}).strict()

export const AdminLogsQuerySchema = z.object({
  entity: z.string().trim().max(120).optional(),
  entityId: z.string().trim().max(120).optional(),
  action: z.string().trim().max(120).optional(),
  source: z.enum(['audit', 'admin', 'all']).optional(),
  userId: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
}).strict()
