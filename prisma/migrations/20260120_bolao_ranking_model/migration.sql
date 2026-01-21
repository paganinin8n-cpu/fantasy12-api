-- 1️⃣ Criar enum de status do ranking
CREATE TYPE "RankingStatus" AS ENUM (
  'DRAFT',
  'ACTIVE',
  'CLOSED'
);

-- 2️⃣ Alterar tabela rankings (incremental)
ALTER TABLE "rankings"
ADD COLUMN "status" "RankingStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "maxParticipants" INTEGER,
ADD COLUMN "currentParticipants" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "durationDays" INTEGER,
ADD COLUMN "createdByUserId" UUID;

-- 3️⃣ Relacionamento com usuário criador do bolão
ALTER TABLE "rankings"
ADD CONSTRAINT "rankings_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId")
REFERENCES "users"("id")
ON DELETE SET NULL;
