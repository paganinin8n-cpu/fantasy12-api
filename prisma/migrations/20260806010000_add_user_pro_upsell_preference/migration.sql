-- Persist the authenticated user's permanent opt-out from the PRO upsell.
-- Forward-only Prisma migration. Rollback requires a new migration after
-- deploying an application version that no longer reads this column.
ALTER TABLE "users"
ADD COLUMN "proUpsellDisabled" BOOLEAN NOT NULL DEFAULT false;
