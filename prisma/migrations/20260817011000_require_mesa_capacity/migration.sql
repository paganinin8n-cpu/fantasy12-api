-- Schema migration: every Mesa must have a positive capacity. Other ranking
-- types do not use this field and may keep it null.
ALTER TABLE "rankings"
  DROP CONSTRAINT IF EXISTS "rankings_mesa_capacity_positive_check",
  ADD CONSTRAINT "rankings_mesa_capacity_positive_check"
  CHECK (
    "type" <> 'BOLAO'
    OR ("maxParticipants" IS NOT NULL AND "maxParticipants" > 0)
  ) NOT VALID;

ALTER TABLE "rankings"
  VALIDATE CONSTRAINT "rankings_mesa_capacity_positive_check";
