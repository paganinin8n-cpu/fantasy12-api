CREATE UNIQUE INDEX IF NOT EXISTS "users_email_canonical_key"
ON "users" (LOWER(BTRIM("email")));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_email_is_canonical'
  ) THEN
    ALTER TABLE "users"
    ADD CONSTRAINT "users_email_is_canonical"
    CHECK ("email" = LOWER(BTRIM("email")));
  END IF;
END $$;
