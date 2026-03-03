-- =====================================================
-- ADMIN v2.1 — RBAC + AUDITORIA + GOVERNANÇA
-- =====================================================

-- ============================
-- ADMIN ROLE
-- ============================

CREATE TABLE "AdminRole" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- ADMIN PERMISSION
-- ============================

CREATE TABLE "AdminPermission" (
    "id" TEXT PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- ROLE ↔ PERMISSION
-- ============================

CREATE TABLE "AdminRolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    PRIMARY KEY ("roleId", "permissionId"),
    CONSTRAINT "AdminRolePermission_role_fkey"
        FOREIGN KEY ("roleId") REFERENCES "AdminRole"("id")
        ON DELETE CASCADE,
    CONSTRAINT "AdminRolePermission_permission_fkey"
        FOREIGN KEY ("permissionId") REFERENCES "AdminPermission"("id")
        ON DELETE CASCADE
);

-- ============================
-- USER ↔ ADMIN ROLE
-- ============================

CREATE TABLE "UserAdminRole" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserAdminRole_user_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id")
        ON DELETE CASCADE,
    CONSTRAINT "UserAdminRole_role_fkey"
        FOREIGN KEY ("roleId") REFERENCES "AdminRole"("id")
        ON DELETE CASCADE
);

CREATE INDEX "UserAdminRole_user_idx" ON "UserAdminRole"("userId");
CREATE INDEX "UserAdminRole_role_idx" ON "UserAdminRole"("roleId");

-- ============================
-- ADMIN AUDIT LOG
-- ============================

CREATE TABLE "AdminAuditLog" (
    "id" TEXT PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "payload" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAuditLog_admin_fkey"
        FOREIGN KEY ("adminId") REFERENCES "users"("id")
        ON DELETE CASCADE
);

CREATE INDEX "AdminAuditLog_admin_idx" ON "AdminAuditLog"("adminId");
CREATE INDEX "AdminAuditLog_entity_idx" ON "AdminAuditLog"("entity");

-- ============================
-- INTERNAL JOB EXECUTION
-- ============================

CREATE TABLE "InternalJobExecution" (
    "id" TEXT PRIMARY KEY,
    "jobName" TEXT NOT NULL,
    "referenceId" TEXT,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP,
    "error" TEXT
);

CREATE INDEX "InternalJobExecution_job_idx" ON "InternalJobExecution"("jobName");
CREATE INDEX "InternalJobExecution_reference_idx" ON "InternalJobExecution"("referenceId");

-- ============================
-- SYSTEM LOCKS
-- ============================

CREATE TABLE "SystemLock" (
    "id" TEXT PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "enabled" BOOLEAN NOT NULL DEFAULT FALSE,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- FEATURE FLAGS
-- ============================

CREATE TABLE "FeatureFlag" (
    "id" TEXT PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "enabled" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);