-- Expand-only schema change. Rollback plan: a forward migration may drop
-- "cancelled" after every application version stops reading or writing it.
ALTER TABLE "round_matches"
ADD COLUMN "cancelled" BOOLEAN NOT NULL DEFAULT false;
