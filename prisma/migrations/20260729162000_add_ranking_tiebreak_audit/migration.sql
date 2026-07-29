-- Regra oficial v2: score, Super Duplas, Duplas e antiguidade da conta.
-- Migration aditiva e retrocompativel. Rankings legados permanecem com v1/null
-- ate serem recalculados ou fechados pela nova versao da aplicacao.
ALTER TABLE "ranking_participants"
  ADD COLUMN "tiebreakSuperDoubleHits" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "tiebreakDoubleHits" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "tiebreakUserCreatedAt" TIMESTAMP(3),
  ADD COLUMN "tiebreakRuleVersion" TEXT;

-- Rollback operacional: criar uma nova migration forward-only removendo
-- estas quatro colunas depois de publicar uma versao que nao as utilize.
