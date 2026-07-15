-- Expand-only schema change. Rollback requires a forward migration after all
-- application versions stop using these columns.
ALTER TABLE "users"
ADD COLUMN "scoreTotal" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "rankings"
ADD COLUMN "periodRef" TEXT;

CREATE UNIQUE INDEX "rankings_type_periodRef_key"
ON "rankings"("type", "periodRef");

CREATE INDEX "rankings_periodRef_idx"
ON "rankings"("periodRef");
