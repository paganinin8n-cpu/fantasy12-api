-- Compatibility bridge for rolling deployments: old instances may still
-- write legacy names, while new instances write canonical Mesa names.
CREATE OR REPLACE FUNCTION "sync_mesa_financial_columns"()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW."accessCost" := COALESCE(NEW."accessCost", NEW."entryFee", 0);
    NEW."entryFee" := COALESCE(NEW."entryFee", NEW."accessCost", 0);
    NEW."rewardPool" := COALESCE(NEW."rewardPool", NEW."prizePool", 0);
    NEW."prizePool" := COALESCE(NEW."prizePool", NEW."rewardPool", 0);
    RETURN NEW;
  END IF;

  IF NEW."accessCost" IS DISTINCT FROM OLD."accessCost" THEN
    NEW."entryFee" := COALESCE(NEW."accessCost", NEW."entryFee", 0);
  ELSIF NEW."entryFee" IS DISTINCT FROM OLD."entryFee" THEN
    NEW."accessCost" := NEW."entryFee";
  END IF;

  IF NEW."rewardPool" IS DISTINCT FROM OLD."rewardPool" THEN
    NEW."prizePool" := COALESCE(NEW."rewardPool", NEW."prizePool", 0);
  ELSIF NEW."prizePool" IS DISTINCT FROM OLD."prizePool" THEN
    NEW."rewardPool" := NEW."prizePool";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "rankings_sync_mesa_financial_columns"
BEFORE INSERT OR UPDATE OF "entryFee", "accessCost", "prizePool", "rewardPool"
ON "rankings"
FOR EACH ROW
EXECUTE FUNCTION "sync_mesa_financial_columns"();
