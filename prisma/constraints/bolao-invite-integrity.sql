DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bolao_invites_used_count_non_negative'
  ) THEN
    ALTER TABLE "bolao_invites"
    ADD CONSTRAINT "bolao_invites_used_count_non_negative"
    CHECK ("usedCount" >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bolao_invites_max_uses_positive'
  ) THEN
    ALTER TABLE "bolao_invites"
    ADD CONSTRAINT "bolao_invites_max_uses_positive"
    CHECK ("maxUses" IS NULL OR "maxUses" > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bolao_invites_usage_within_limit'
  ) THEN
    ALTER TABLE "bolao_invites"
    ADD CONSTRAINT "bolao_invites_usage_within_limit"
    CHECK ("maxUses" IS NULL OR "usedCount" <= "maxUses");
  END IF;
END $$;
