-- PRO deixou de ser role estrutural. A elegibilidade PRO vem de Subscription.
-- Usuários legados com role=PRO passam para NORMAL antes da troca do enum,
-- preservando assinatura, carteira e histórico.
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'NORMAL');

ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING (
    CASE
      WHEN "role"::text = 'PRO' THEN 'NORMAL'
      ELSE "role"::text
    END
  )::"UserRole_new";

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'NORMAL';
