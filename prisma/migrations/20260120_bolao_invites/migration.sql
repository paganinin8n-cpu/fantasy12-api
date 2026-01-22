-- 1️⃣ Criar tabela bolao_invites
CREATE TABLE "bolao_invites" (
  "id" UUID PRIMARY KEY,
  "rankingId" TEXT NOT NULL,
  "code" TEXT NOT NULL UNIQUE,

  "maxUses" INTEGER,
  "usedCount" INTEGER NOT NULL DEFAULT 0,

  "expiresAt" TIMESTAMP,
  "isActive" BOOLEAN NOT NULL DEFAULT true,

  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 2️⃣ FK para ranking (bolão)
ALTER TABLE "bolao_invites"
ADD CONSTRAINT "bolao_invites_rankingId_fkey"
FOREIGN KEY ("rankingId")
REFERENCES "rankings"("id")
ON DELETE CASCADE;

-- 3️⃣ FK para usuário criador
ALTER TABLE "bolao_invites"
ADD CONSTRAINT "bolao_invites_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId")
REFERENCES "users"("id")
ON DELETE CASCADE;

-- 4️⃣ Índices auxiliares
CREATE INDEX "bolao_invites_rankingId_idx" ON "bolao_invites"("rankingId");
CREATE INDEX "bolao_invites_code_idx" ON "bolao_invites"("code");
