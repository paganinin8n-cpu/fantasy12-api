-- New rows receive safe defaults. Columns remain nullable until the contract
-- phase, after all application instances have completed the dual-write cutover.
ALTER TABLE "rankings"
  ALTER COLUMN "accessCost" SET DEFAULT 0,
  ALTER COLUMN "rewardPool" SET DEFAULT 0;
