BEGIN;

ALTER TABLE "wallets"
  ADD CONSTRAINT "wallets_balance_non_negative"
  CHECK ("balance" >= 0) NOT VALID;
ALTER TABLE "wallets"
  VALIDATE CONSTRAINT "wallets_balance_non_negative";

ALTER TABLE "wallet_ledger"
  ADD CONSTRAINT "wallet_ledger_amount_positive"
  CHECK ("amount" > 0) NOT VALID;
ALTER TABLE "wallet_ledger"
  VALIDATE CONSTRAINT "wallet_ledger_amount_positive";

ALTER TABLE "round_benefits"
  ADD CONSTRAINT "round_benefits_free_doubles_non_negative"
  CHECK ("freeDoubles" >= 0) NOT VALID,
  ADD CONSTRAINT "round_benefits_free_super_doubles_non_negative"
  CHECK ("freeSuperDoubles" >= 0) NOT VALID;
ALTER TABLE "round_benefits"
  VALIDATE CONSTRAINT "round_benefits_free_doubles_non_negative";
ALTER TABLE "round_benefits"
  VALIDATE CONSTRAINT "round_benefits_free_super_doubles_non_negative";

ALTER TABLE "user_benefit_inventory"
  ADD CONSTRAINT "user_benefit_inventory_quantity_non_negative"
  CHECK ("quantity" >= 0) NOT VALID;
ALTER TABLE "user_benefit_inventory"
  VALIDATE CONSTRAINT "user_benefit_inventory_quantity_non_negative";

COMMIT;
