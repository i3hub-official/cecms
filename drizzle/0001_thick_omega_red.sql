ALTER TABLE "admin_activities" RENAME COLUMN "admin_id" TO "adminId";--> statement-breakpoint
ALTER TABLE "admin_sessions" RENAME COLUMN "admin_id" TO "adminId";--> statement-breakpoint
ALTER TABLE "admin_sessions" RENAME COLUMN "session_id" TO "sessionId";--> statement-breakpoint
ALTER TABLE "admin_sessions" RENAME COLUMN "is_active" TO "isActive";--> statement-breakpoint
ALTER TABLE "admin_sessions" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "admin_sessions" RENAME COLUMN "expires_at" TO "expiresAt";--> statement-breakpoint
ALTER TABLE "admin_sessions" RENAME COLUMN "last_used" TO "lastUsed";--> statement-breakpoint
ALTER TABLE "admin_sessions" RENAME COLUMN "user_agent" TO "userAgent";--> statement-breakpoint
ALTER TABLE "admin_sessions" RENAME COLUMN "ip_address" TO "ipAddress";--> statement-breakpoint
ALTER TABLE "admin_sessions" RENAME COLUMN "device_type" TO "deviceType";--> statement-breakpoint
ALTER TABLE "admins" RENAME COLUMN "is_active" TO "isActive";--> statement-breakpoint
ALTER TABLE "admins" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "audit_logs" RENAME COLUMN "admin_id" TO "adminId";--> statement-breakpoint
ALTER TABLE "audit_logs" RENAME COLUMN "entity_id" TO "entityId";--> statement-breakpoint
ALTER TABLE "centers" RENAME COLUMN "is_active" TO "isActive";--> statement-breakpoint
ALTER TABLE "centers" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "centers" RENAME COLUMN "created_by" TO "createdBy";--> statement-breakpoint
ALTER TABLE "centers" RENAME COLUMN "modified_by" TO "modifiedBy";--> statement-breakpoint
ALTER TABLE "centers" RENAME COLUMN "modified_at" TO "modifiedAt";--> statement-breakpoint
ALTER TABLE "password_resets" RENAME COLUMN "admin_id" TO "adminId";--> statement-breakpoint
ALTER TABLE "password_resets" RENAME COLUMN "is_used" TO "isUsed";--> statement-breakpoint
ALTER TABLE "password_resets" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "password_resets" RENAME COLUMN "expires_at" TO "expiresAt";--> statement-breakpoint
ALTER TABLE "admin_sessions" DROP CONSTRAINT "admin_sessions_session_id_unique";--> statement-breakpoint
ALTER TABLE "admin_activities" DROP CONSTRAINT "admin_activities_admin_id_admins_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_sessions" DROP CONSTRAINT "admin_sessions_admin_id_admins_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_admin_id_admins_id_fk";
--> statement-breakpoint
ALTER TABLE "password_resets" DROP CONSTRAINT "password_resets_admin_id_admins_id_fk";
--> statement-breakpoint
DROP INDEX "idx_admin_session_is_active";--> statement-breakpoint
DROP INDEX "idx_admin_session_created_at";--> statement-breakpoint
DROP INDEX "idx_admin_session_expires_at";--> statement-breakpoint
DROP INDEX "idx_admin_session_last_used";--> statement-breakpoint
DROP INDEX "idx_admin_session_ip_address";--> statement-breakpoint
DROP INDEX "idx_admin_session_device_type";--> statement-breakpoint
DROP INDEX "idx_admin_is_active";--> statement-breakpoint
DROP INDEX "idx_admin_created_at";--> statement-breakpoint
DROP INDEX "idx_center_is_active";--> statement-breakpoint
DROP INDEX "idx_center_created_at";--> statement-breakpoint
DROP INDEX "idx_center_lga_is_active";--> statement-breakpoint
DROP INDEX "idx_center_state_is_active";--> statement-breakpoint
DROP INDEX "idx_center_created_by";--> statement-breakpoint
DROP INDEX "idx_center_modified_by";--> statement-breakpoint
DROP INDEX "idx_center_modified_at";--> statement-breakpoint
DROP INDEX "idx_center_created_at_is_active";--> statement-breakpoint
DROP INDEX "idx_password_reset_is_used";--> statement-breakpoint
DROP INDEX "idx_password_reset_created_at";--> statement-breakpoint
DROP INDEX "idx_password_reset_expires_at";--> statement-breakpoint
ALTER TABLE "admin_activities" ADD CONSTRAINT "admin_activities_adminId_admins_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_adminId_admins_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminId_admins_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_adminId_admins_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admin_session_is_active" ON "admin_sessions" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "idx_admin_session_created_at" ON "admin_sessions" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_admin_session_expires_at" ON "admin_sessions" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "idx_admin_session_last_used" ON "admin_sessions" USING btree ("lastUsed");--> statement-breakpoint
CREATE INDEX "idx_admin_session_ip_address" ON "admin_sessions" USING btree ("ipAddress");--> statement-breakpoint
CREATE INDEX "idx_admin_session_device_type" ON "admin_sessions" USING btree ("deviceType");--> statement-breakpoint
CREATE INDEX "idx_admin_is_active" ON "admins" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "idx_admin_created_at" ON "admins" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_center_is_active" ON "centers" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "idx_center_created_at" ON "centers" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_center_lga_is_active" ON "centers" USING btree ("lga","isActive");--> statement-breakpoint
CREATE INDEX "idx_center_state_is_active" ON "centers" USING btree ("state","isActive");--> statement-breakpoint
CREATE INDEX "idx_center_created_by" ON "centers" USING btree ("createdBy");--> statement-breakpoint
CREATE INDEX "idx_center_modified_by" ON "centers" USING btree ("modifiedBy");--> statement-breakpoint
CREATE INDEX "idx_center_modified_at" ON "centers" USING btree ("modifiedAt");--> statement-breakpoint
CREATE INDEX "idx_center_created_at_is_active" ON "centers" USING btree ("createdAt","isActive");--> statement-breakpoint
CREATE INDEX "idx_password_reset_is_used" ON "password_resets" USING btree ("isUsed");--> statement-breakpoint
CREATE INDEX "idx_password_reset_created_at" ON "password_resets" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_password_reset_expires_at" ON "password_resets" USING btree ("expiresAt");--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_sessionId_unique" UNIQUE("sessionId");