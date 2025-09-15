-- CreateTable
CREATE TABLE "public"."centers" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "modifiedBy" TEXT,
    "modifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_sessions" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."password_resets" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_logs" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "request" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_activities" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "centers_number_key" ON "public"."centers"("number");

-- CreateIndex
CREATE INDEX "idx_center_state" ON "public"."centers"("state");

-- CreateIndex
CREATE INDEX "idx_center_lga" ON "public"."centers"("lga");

-- CreateIndex
CREATE INDEX "idx_center_is_active" ON "public"."centers"("isActive");

-- CreateIndex
CREATE INDEX "idx_center_created_at" ON "public"."centers"("createdAt");

-- CreateIndex
CREATE INDEX "idx_center_name" ON "public"."centers"("name");

-- CreateIndex
CREATE INDEX "idx_center_number" ON "public"."centers"("number");

-- CreateIndex
CREATE INDEX "idx_center_state_lga" ON "public"."centers"("state", "lga");

-- CreateIndex
CREATE INDEX "idx_center_lga_is_active" ON "public"."centers"("lga", "isActive");

-- CreateIndex
CREATE INDEX "idx_center_state_is_active" ON "public"."centers"("state", "isActive");

-- CreateIndex
CREATE INDEX "idx_center_created_by" ON "public"."centers"("createdBy");

-- CreateIndex
CREATE INDEX "idx_center_modified_by" ON "public"."centers"("modifiedBy");

-- CreateIndex
CREATE INDEX "idx_center_modified_at" ON "public"."centers"("modifiedAt");

-- CreateIndex
CREATE INDEX "idx_center_created_at_is_active" ON "public"."centers"("createdAt", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "centers_name_state_lga_key" ON "public"."centers"("name", "state", "lga");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "public"."admins"("email");

-- CreateIndex
CREATE INDEX "idx_admin_email" ON "public"."admins"("email");

-- CreateIndex
CREATE INDEX "idx_admin_is_active" ON "public"."admins"("isActive");

-- CreateIndex
CREATE INDEX "idx_admin_role" ON "public"."admins"("role");

-- CreateIndex
CREATE INDEX "idx_admin_created_at" ON "public"."admins"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_sessionId_key" ON "public"."admin_sessions"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_key" ON "public"."admin_sessions"("token");

-- CreateIndex
CREATE INDEX "idx_admin_session_is_active" ON "public"."admin_sessions"("isActive");

-- CreateIndex
CREATE INDEX "idx_admin_session_created_at" ON "public"."admin_sessions"("createdAt");

-- CreateIndex
CREATE INDEX "idx_admin_session_expires_at" ON "public"."admin_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_admin_session_last_used" ON "public"."admin_sessions"("lastUsed");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "public"."password_resets"("token");

-- CreateIndex
CREATE INDEX "idx_password_reset_is_used" ON "public"."password_resets"("isUsed");

-- CreateIndex
CREATE INDEX "idx_password_reset_created_at" ON "public"."password_resets"("createdAt");

-- CreateIndex
CREATE INDEX "idx_password_reset_expires_at" ON "public"."password_resets"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_api_log_endpoint" ON "public"."api_logs"("endpoint");

-- CreateIndex
CREATE INDEX "idx_api_log_method" ON "public"."api_logs"("method");

-- CreateIndex
CREATE INDEX "idx_api_log_status" ON "public"."api_logs"("status");

-- CreateIndex
CREATE INDEX "idx_api_log_timestamp" ON "public"."api_logs"("timestamp");

-- CreateIndex
CREATE INDEX "idx_admin_activity_activity" ON "public"."admin_activities"("activity");

-- CreateIndex
CREATE INDEX "idx_admin_activity_timestamp" ON "public"."admin_activities"("timestamp");

-- CreateIndex
CREATE INDEX "idx_audit_log_action" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "idx_audit_log_entity" ON "public"."audit_logs"("entity");

-- AddForeignKey
ALTER TABLE "public"."admin_sessions" ADD CONSTRAINT "admin_sessions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."password_resets" ADD CONSTRAINT "password_resets_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_activities" ADD CONSTRAINT "admin_activities_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
