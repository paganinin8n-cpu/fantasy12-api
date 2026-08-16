-- Expansão compatível: Mesas existentes permanecem PAID e conservam entryEndDate.
CREATE TYPE "MesaCategory" AS ENUM (
  'PAID',
  'SPONSORED_FREE'
);

ALTER TABLE "rankings"
  ADD COLUMN "category" "MesaCategory" NOT NULL DEFAULT 'PAID',
  ADD COLUMN "sponsorPrizePool" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "rankings"
  ADD CONSTRAINT "rankings_sponsor_prize_pool_nonnegative_check"
  CHECK ("sponsorPrizePool" >= 0) NOT VALID,
  ADD CONSTRAINT "rankings_mesa_capacity_positive_check"
  CHECK ("type" <> 'BOLAO' OR "maxParticipants" IS NULL OR "maxParticipants" > 0) NOT VALID,
  ADD CONSTRAINT "rankings_mesa_category_terms_check"
  CHECK (
    "type" <> 'BOLAO'
    -- PAID legado pode continuar sem limite; toda criação nova exige limite na API.
    OR ("category" = 'PAID' AND COALESCE("accessCost", "entryFee") > 0 AND "sponsorPrizePool" = 0)
    OR ("category" = 'SPONSORED_FREE' AND COALESCE("accessCost", "entryFee") = 0 AND "sponsorPrizePool" > 0 AND "maxParticipants" > 0)
  ) NOT VALID;
