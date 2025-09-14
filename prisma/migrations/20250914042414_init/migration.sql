/*
  Warnings:

  - A unique constraint covering the columns `[name,state,lga]` on the table `centers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lga` to the `centers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `centers` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."admins_email_key";

-- AlterTable
ALTER TABLE "public"."centers" ADD COLUMN     "lga" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "idx_admin_activity_activity" ON "public"."admin_activities"("activity");

-- CreateIndex
CREATE INDEX "idx_admin_activity_timestamp" ON "public"."admin_activities"("timestamp");

-- CreateIndex
CREATE INDEX "idx_admin_session_is_active" ON "public"."admin_sessions"("isActive");

-- CreateIndex
CREATE INDEX "idx_admin_session_created_at" ON "public"."admin_sessions"("createdAt");

-- CreateIndex
CREATE INDEX "idx_admin_session_expires_at" ON "public"."admin_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_admin_session_last_used" ON "public"."admin_sessions"("lastUsed");

-- CreateIndex
CREATE INDEX "idx_admin_email" ON "public"."admins"("email");

-- CreateIndex
CREATE INDEX "idx_admin_is_active" ON "public"."admins"("isActive");

-- CreateIndex
CREATE INDEX "idx_admin_role" ON "public"."admins"("role");

-- CreateIndex
CREATE INDEX "idx_admin_created_at" ON "public"."admins"("createdAt");

-- CreateIndex
CREATE INDEX "idx_api_log_endpoint" ON "public"."api_logs"("endpoint");

-- CreateIndex
CREATE INDEX "idx_api_log_method" ON "public"."api_logs"("method");

-- CreateIndex
CREATE INDEX "idx_api_log_status" ON "public"."api_logs"("status");

-- CreateIndex
CREATE INDEX "idx_api_log_timestamp" ON "public"."api_logs"("timestamp");

-- CreateIndex
CREATE INDEX "idx_audit_log_action" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "idx_audit_log_entity" ON "public"."audit_logs"("entity");

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
CREATE INDEX "idx_password_reset_is_used" ON "public"."password_resets"("isUsed");

-- CreateIndex
CREATE INDEX "idx_password_reset_created_at" ON "public"."password_resets"("createdAt");

-- CreateIndex
CREATE INDEX "idx_password_reset_expires_at" ON "public"."password_resets"("expiresAt");
