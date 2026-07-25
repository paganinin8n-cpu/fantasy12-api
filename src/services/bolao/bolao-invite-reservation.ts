import { Prisma } from '@prisma/client'

type InviteReservation = {
  usedCount: number
}

/**
 * Reserva um uso do convite com compare-and-increment no PostgreSQL.
 *
 * O UPDATE mantém limite, expiração e incremento na mesma operação atômica.
 * Quando usado dentro da transação de entrada, qualquer falha posterior faz
 * rollback da reserva.
 */
export async function reserveBolaoInviteUse(
  tx: Prisma.TransactionClient,
  inviteId: string,
  now: Date
): Promise<InviteReservation | null> {
  const rows = await tx.$queryRaw<InviteReservation[]>(Prisma.sql`
    UPDATE "bolao_invites"
    SET "usedCount" = "usedCount" + 1
    WHERE "id" = ${inviteId}
      AND "isActive" = TRUE
      AND ("expiresAt" IS NULL OR "expiresAt" > ${now})
      AND ("maxUses" IS NULL OR "usedCount" < "maxUses")
    RETURNING "usedCount"
  `)

  return rows[0] ?? null
}
