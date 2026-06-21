import { z } from 'zod'

export const AdminUserReasonSchema = z.object({
  reason: z.string().min(3, 'motivo deve ter ao menos 3 caracteres').max(500),
})

export const AdminUserSubscriptionSchema = z.object({
  plan: z.enum(['MONTHLY', 'ANNUAL']),
  status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']),
  startAt: z.string().datetime('startAt deve ser uma data ISO valida'),
  endAt: z.string().datetime('endAt deve ser uma data ISO valida').nullable().optional(),
  reason: z.string().min(3, 'motivo deve ter ao menos 3 caracteres').max(500),
})

export const AdminUserRolesSchema = z.object({
  roles: z.array(z.enum(['ADMIN', 'SUPERADMIN'])).max(2),
  reason: z.string().min(3, 'motivo deve ter ao menos 3 caracteres').max(500),
})
