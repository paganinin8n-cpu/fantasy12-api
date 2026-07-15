-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'NORMAL');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('DRAFT', 'PENDING', 'OPEN', 'CLOSED', 'SCORED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "BetType" AS ENUM ('NONE', 'DOUBLE', 'SUPER_DOUBLE');

-- CreateEnum
CREATE TYPE "RankingType" AS ENUM ('GLOBAL', 'PRO', 'BOLAO');

-- CreateEnum
CREATE TYPE "RankingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "RankingParticipantStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('CLUB', 'NATIONAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CARD');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MERCADO_PAGO');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('WALLET_CREDIT', 'SUBSCRIPTION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'NORMAL',
    "nickname" TEXT,
    "cpf" TEXT,
    "profileImage" TEXT,
    "bio" TEXT,
    "phone" TEXT,
    "scoreTotal" INTEGER NOT NULL DEFAULT 0,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "adminBlockedAt" TIMESTAMP(3),
    "adminBlockedReason" TEXT,
    "adminBlockedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "country" TEXT,
    "type" "TeamType" NOT NULL DEFAULT 'CLUB',
    "logoUrl" TEXT,
    "externalId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rounds" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'DRAFT',
    "openAt" TIMESTAMP(3),
    "closeAt" TIMESTAMP(3),
    "result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "round_matches" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "groupLabel" TEXT,
    "matchTime" TIMESTAMP(3),
    "result" TEXT,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "homeTeamId" TEXT,
    "awayTeamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "round_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "prediction" TEXT NOT NULL,
    "multipliers" INTEGER[],
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "scoreRound" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_score_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "scoreRound" INTEGER NOT NULL,
    "scoreTotal" INTEGER NOT NULL,
    "totalDoubles" INTEGER NOT NULL DEFAULT 0,
    "totalSuperDoubles" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_score_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rankings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "RankingType" NOT NULL,
    "status" "RankingStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "periodRef" TEXT,
    "entryFee" INTEGER NOT NULL DEFAULT 0,
    "maxParticipants" INTEGER,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "durationDays" INTEGER,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_participants" (
    "id" TEXT NOT NULL,
    "rankingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "scoreInitial" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER,
    "status" "RankingParticipantStatus" NOT NULL DEFAULT 'APPROVED',
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranking_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_rounds" (
    "id" TEXT NOT NULL,
    "rankingId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_snapshots" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scoreTotal" INTEGER NOT NULL,
    "scoreRound" INTEGER NOT NULL,
    "totalDoubles" INTEGER NOT NULL DEFAULT 0,
    "totalSuperDoubles" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL,
    "snapshotType" TEXT NOT NULL,
    "periodRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "provider" "PaymentProvider",
    "externalSubscriptionId" TEXT,
    "externalCustomerId" TEXT,
    "packageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_ledger" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "round_benefits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "freeDoubles" INTEGER NOT NULL DEFAULT 0,
    "freeSuperDoubles" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "round_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bolao_invites" (
    "id" TEXT NOT NULL,
    "rankingId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bolao_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentPackage" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "coinsAmount" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "bonusCoins" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL DEFAULT 'WALLET_CREDIT',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "packageId" TEXT,
    "subscriptionPlan" "SubscriptionPlan",
    "amountCents" INTEGER NOT NULL,
    "coinsAmount" INTEGER NOT NULL,
    "bonusCoins" INTEGER NOT NULL DEFAULT 0,
    "externalPaymentId" TEXT,
    "externalReference" TEXT,
    "externalPreferenceId" TEXT,
    "checkoutUrl" TEXT,
    "isCredited" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "AdminRolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "UserAdminRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAdminRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "payload" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalJobExecution" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "referenceId" TEXT,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "InternalJobExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemLock" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_benefit_inventory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BetType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_benefit_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- CreateIndex
CREATE INDEX "users_adminBlockedAt_idx" ON "users"("adminBlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expiresAt_idx" ON "password_reset_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "teams_externalId_key" ON "teams"("externalId");

-- CreateIndex
CREATE INDEX "teams_name_idx" ON "teams"("name");

-- CreateIndex
CREATE INDEX "teams_country_idx" ON "teams"("country");

-- CreateIndex
CREATE INDEX "teams_type_idx" ON "teams"("type");

-- CreateIndex
CREATE UNIQUE INDEX "rounds_number_key" ON "rounds"("number");

-- CreateIndex
CREATE INDEX "round_matches_roundId_idx" ON "round_matches"("roundId");

-- CreateIndex
CREATE INDEX "round_matches_homeTeamId_idx" ON "round_matches"("homeTeamId");

-- CreateIndex
CREATE INDEX "round_matches_awayTeamId_idx" ON "round_matches"("awayTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "round_matches_roundId_position_key" ON "round_matches"("roundId", "position");

-- CreateIndex
CREATE INDEX "tickets_userId_idx" ON "tickets"("userId");

-- CreateIndex
CREATE INDEX "tickets_roundId_idx" ON "tickets"("roundId");

-- CreateIndex
CREATE INDEX "tickets_userId_createdAt_idx" ON "tickets"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_userId_roundId_key" ON "tickets"("userId", "roundId");

-- CreateIndex
CREATE INDEX "user_score_history_userId_idx" ON "user_score_history"("userId");

-- CreateIndex
CREATE INDEX "user_score_history_roundId_idx" ON "user_score_history"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "user_score_history_userId_roundId_key" ON "user_score_history"("userId", "roundId");

-- CreateIndex
CREATE UNIQUE INDEX "rankings_name_key" ON "rankings"("name");

-- CreateIndex
CREATE INDEX "rankings_periodRef_idx" ON "rankings"("periodRef");

-- CreateIndex
CREATE UNIQUE INDEX "rankings_type_periodRef_key" ON "rankings"("type", "periodRef");

-- CreateIndex
CREATE INDEX "ranking_participants_rankingId_idx" ON "ranking_participants"("rankingId");

-- CreateIndex
CREATE INDEX "ranking_participants_userId_idx" ON "ranking_participants"("userId");

-- CreateIndex
CREATE INDEX "ranking_participants_status_idx" ON "ranking_participants"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_participants_rankingId_userId_key" ON "ranking_participants"("rankingId", "userId");

-- CreateIndex
CREATE INDEX "ranking_rounds_rankingId_idx" ON "ranking_rounds"("rankingId");

-- CreateIndex
CREATE INDEX "ranking_rounds_roundId_idx" ON "ranking_rounds"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_rounds_rankingId_roundId_key" ON "ranking_rounds"("rankingId", "roundId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "ranking_snapshots_roundId_idx" ON "ranking_snapshots"("roundId");

-- CreateIndex
CREATE INDEX "ranking_snapshots_userId_idx" ON "ranking_snapshots"("userId");

-- CreateIndex
CREATE INDEX "ranking_snapshots_roundId_scoreTotal_idx" ON "ranking_snapshots"("roundId", "scoreTotal");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_snapshots_roundId_userId_key" ON "ranking_snapshots"("roundId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_endAt_idx" ON "subscriptions"("endAt");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE INDEX "wallet_ledger_walletId_idx" ON "wallet_ledger"("walletId");

-- CreateIndex
CREATE INDEX "round_benefits_roundId_idx" ON "round_benefits"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "round_benefits_userId_roundId_key" ON "round_benefits"("userId", "roundId");

-- CreateIndex
CREATE UNIQUE INDEX "bolao_invites_code_key" ON "bolao_invites"("code");

-- CreateIndex
CREATE INDEX "bolao_invites_rankingId_idx" ON "bolao_invites"("rankingId");

-- CreateIndex
CREATE INDEX "bolao_invites_code_idx" ON "bolao_invites"("code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_externalPaymentId_key" ON "payments"("externalPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_externalReference_key" ON "payments"("externalReference");

-- CreateIndex
CREATE UNIQUE INDEX "payments_externalPreferenceId_key" ON "payments"("externalPreferenceId");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_packageId_idx" ON "payments"("packageId");

-- CreateIndex
CREATE INDEX "payments_userId_createdAt_idx" ON "payments"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_provider_externalEventId_key" ON "payment_webhook_events"("provider", "externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminRole_name_key" ON "AdminRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_code_key" ON "AdminPermission"("code");

-- CreateIndex
CREATE INDEX "UserAdminRole_userId_idx" ON "UserAdminRole"("userId");

-- CreateIndex
CREATE INDEX "UserAdminRole_roleId_idx" ON "UserAdminRole"("roleId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_entity_idx" ON "AdminAuditLog"("entity");

-- CreateIndex
CREATE INDEX "InternalJobExecution_jobName_idx" ON "InternalJobExecution"("jobName");

-- CreateIndex
CREATE INDEX "InternalJobExecution_referenceId_idx" ON "InternalJobExecution"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemLock_code_key" ON "SystemLock"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_code_key" ON "FeatureFlag"("code");

-- CreateIndex
CREATE INDEX "user_benefit_inventory_userId_idx" ON "user_benefit_inventory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_benefit_inventory_userId_type_key" ON "user_benefit_inventory"("userId", "type");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_matches" ADD CONSTRAINT "round_matches_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_matches" ADD CONSTRAINT "round_matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_matches" ADD CONSTRAINT "round_matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_score_history" ADD CONSTRAINT "user_score_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_score_history" ADD CONSTRAINT "user_score_history_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_participants" ADD CONSTRAINT "ranking_participants_rankingId_fkey" FOREIGN KEY ("rankingId") REFERENCES "rankings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_participants" ADD CONSTRAINT "ranking_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_participants" ADD CONSTRAINT "ranking_participants_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_rounds" ADD CONSTRAINT "ranking_rounds_rankingId_fkey" FOREIGN KEY ("rankingId") REFERENCES "rankings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_rounds" ADD CONSTRAINT "ranking_rounds_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_snapshots" ADD CONSTRAINT "ranking_snapshots_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_snapshots" ADD CONSTRAINT "ranking_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PaymentPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_benefits" ADD CONSTRAINT "round_benefits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_benefits" ADD CONSTRAINT "round_benefits_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bolao_invites" ADD CONSTRAINT "bolao_invites_rankingId_fkey" FOREIGN KEY ("rankingId") REFERENCES "rankings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bolao_invites" ADD CONSTRAINT "bolao_invites_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PaymentPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminRolePermission" ADD CONSTRAINT "AdminRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AdminRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminRolePermission" ADD CONSTRAINT "AdminRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "AdminPermission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAdminRole" ADD CONSTRAINT "UserAdminRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAdminRole" ADD CONSTRAINT "UserAdminRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AdminRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_benefit_inventory" ADD CONSTRAINT "user_benefit_inventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

