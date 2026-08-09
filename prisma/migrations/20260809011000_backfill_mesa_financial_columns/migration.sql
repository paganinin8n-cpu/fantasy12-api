-- Data migration kept separate from the DDL expansion.
UPDATE "rankings"
SET
  "accessCost" = "entryFee",
  "rewardPool" = "prizePool"
WHERE "accessCost" IS NULL OR "rewardPool" IS NULL;
