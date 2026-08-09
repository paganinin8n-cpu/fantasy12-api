-- Expand phase: canonical Mesa fields are nullable while old application
-- versions can still write only the legacy columns.
ALTER TABLE "rankings"
  ADD COLUMN "accessCost" INTEGER,
  ADD COLUMN "rewardPool" INTEGER;
