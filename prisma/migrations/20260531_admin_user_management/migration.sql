ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "adminBlockedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "adminBlockedReason" TEXT,
  ADD COLUMN IF NOT EXISTS "adminBlockedById" TEXT;

CREATE INDEX IF NOT EXISTS "users_adminBlockedAt_idx" ON "users"("adminBlockedAt");
