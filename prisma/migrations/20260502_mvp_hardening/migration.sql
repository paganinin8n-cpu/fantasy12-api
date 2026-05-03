-- ============================================================
-- MVP Hardening — schema changes do release de pre-launch
-- ============================================================
-- Inclui:
--   1. Account lockout (User.failedLoginAttempts, User.lockedUntil)
--   2. Tabela PasswordResetToken
--   3. Indexes adicionais para performance (Ticket / Subscription / Payment)
--   4. Drop do enum TicketBetType (estava órfão no schema, nenhum campo o usava)
-- ============================================================

-- 1) USER: account lockout
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

-- 2) PASSWORD RESET TOKEN
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_tokenHash_key"
  ON "password_reset_tokens"("tokenHash");

CREATE INDEX IF NOT EXISTS "password_reset_tokens_userId_idx"
  ON "password_reset_tokens"("userId");

CREATE INDEX IF NOT EXISTS "password_reset_tokens_expiresAt_idx"
  ON "password_reset_tokens"("expiresAt");

ALTER TABLE "password_reset_tokens"
  ADD CONSTRAINT "password_reset_tokens_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 3) INDEXES de performance

--   tickets: histórico do usuário ordenado por data + filtro por status
CREATE INDEX IF NOT EXISTS "tickets_userId_createdAt_idx"
  ON "tickets"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "tickets_status_idx"
  ON "tickets"("status");

--   subscriptions: jobs de expiração / queries por status
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx"
  ON "subscriptions"("status");
CREATE INDEX IF NOT EXISTS "subscriptions_endAt_idx"
  ON "subscriptions"("endAt");

--   payments: histórico do usuário ordenado por data
CREATE INDEX IF NOT EXISTS "payments_userId_createdAt_idx"
  ON "payments"("userId", "createdAt");

-- 4) DROP enum órfão TicketBetType
--    Defensivo: só dropa se existir e não for usado por nenhuma coluna.
DO $$
DECLARE
  in_use INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'TicketBetType'
  ) THEN
    SELECT COUNT(*) INTO in_use
    FROM information_schema.columns
    WHERE udt_name = 'TicketBetType';

    IF in_use = 0 THEN
      DROP TYPE "TicketBetType";
    END IF;
  END IF;
END $$;
