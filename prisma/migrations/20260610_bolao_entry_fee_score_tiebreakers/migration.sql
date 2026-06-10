-- AddColumn: user_score_history tiebreaker fields
ALTER TABLE "user_score_history" ADD COLUMN "totalDoubles" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "user_score_history" ADD COLUMN "totalSuperDoubles" INTEGER NOT NULL DEFAULT 0;

-- AddColumn: ranking_snapshots tiebreaker fields
ALTER TABLE "ranking_snapshots" ADD COLUMN "totalDoubles" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ranking_snapshots" ADD COLUMN "totalSuperDoubles" INTEGER NOT NULL DEFAULT 0;

-- AddColumn: rankings entry fee
ALTER TABLE "rankings" ADD COLUMN "entryFee" INTEGER NOT NULL DEFAULT 0;
