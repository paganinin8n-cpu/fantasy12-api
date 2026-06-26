-- CreateEnum
CREATE TYPE "RankingParticipantStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "ranking_participants"
ADD COLUMN "status" "RankingParticipantStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN "approvedByUserId" TEXT,
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "rejectedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ranking_participants_status_idx" ON "ranking_participants"("status");

-- AddForeignKey
ALTER TABLE "ranking_participants"
ADD CONSTRAINT "ranking_participants_approvedByUserId_fkey"
FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
