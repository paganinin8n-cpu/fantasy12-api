-- SEC-008 V1: database invariants for conditional invite reservations.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "bolao_invites"
    WHERE "usedCount" < 0
      OR ("maxUses" IS NOT NULL AND "maxUses" <= 0)
      OR ("maxUses" IS NOT NULL AND "usedCount" > "maxUses")
  ) THEN
    RAISE EXCEPTION 'invalid bolao invite counters detected; repair before migration';
  END IF;
END $$;

ALTER TABLE "bolao_invites"
ADD CONSTRAINT "bolao_invites_used_count_non_negative"
CHECK ("usedCount" >= 0);

ALTER TABLE "bolao_invites"
ADD CONSTRAINT "bolao_invites_max_uses_positive"
CHECK ("maxUses" IS NULL OR "maxUses" > 0);

ALTER TABLE "bolao_invites"
ADD CONSTRAINT "bolao_invites_usage_within_limit"
CHECK ("maxUses" IS NULL OR "usedCount" <= "maxUses");
