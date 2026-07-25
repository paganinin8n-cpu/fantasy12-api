-- SEC-009 V1: canonical identity with a collision-safe data migration.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "users"
    GROUP BY LOWER(BTRIM("email"))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'canonical email collision detected; resolve duplicates before migration';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "users"
    WHERE "cpf" IS NOT NULL
    GROUP BY REGEXP_REPLACE("cpf", '[^0-9]', '', 'g')
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'canonical CPF collision detected; resolve duplicates before migration';
  END IF;
END $$;

UPDATE "users"
SET
  "email" = LOWER(BTRIM("email")),
  "cpf" = CASE
    WHEN "cpf" IS NULL THEN NULL
    ELSE REGEXP_REPLACE("cpf", '[^0-9]', '', 'g')
  END,
  "phone" = CASE
    WHEN "phone" IS NULL THEN NULL
    ELSE REGEXP_REPLACE("phone", '[^0-9]', '', 'g')
  END;

CREATE UNIQUE INDEX "users_email_canonical_key"
ON "users" (LOWER(BTRIM("email")));

ALTER TABLE "users"
ADD CONSTRAINT "users_email_is_canonical"
CHECK ("email" = LOWER(BTRIM("email")));
