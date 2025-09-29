CREATE TABLE "admin_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"adminId" text NOT NULL,
	"activity" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_school" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"school_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_school_admin_id_school_id_unique" UNIQUE("admin_id","school_id")
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"adminId" text NOT NULL,
	"sessionId" text NOT NULL,
	"token" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"lastUsed" timestamp DEFAULT now() NOT NULL,
	"userAgent" text,
	"ipAddress" text,
	"location" text,
	"deviceType" text,
	CONSTRAINT "admin_sessions_sessionId_unique" UNIQUE("sessionId"),
	CONSTRAINT "admin_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" text PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'ADMIN' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"isEmailVerified" boolean DEFAULT false NOT NULL,
	"twoFactorEnabled" boolean DEFAULT false NOT NULL,
	"twoFactorSecret" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp,
	"lastLogin" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_phone_unique" UNIQUE("phone"),
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"prefix" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"admin_id" text NOT NULL,
	"can_read" boolean DEFAULT true NOT NULL,
	"can_write" boolean DEFAULT false NOT NULL,
	"can_delete" boolean DEFAULT false NOT NULL,
	"can_manage_keys" boolean DEFAULT false NOT NULL,
	"allowed_endpoints" text DEFAULT '*' NOT NULL,
	"rate_limit" integer DEFAULT 100 NOT NULL,
	"rate_limit_period" integer DEFAULT 60 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp,
	"usage_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "api_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"method" text NOT NULL,
	"status" integer NOT NULL,
	"request" text NOT NULL,
	"response" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_rate_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"api_key_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp NOT NULL,
	"window_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_usage_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"api_key_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"method" text NOT NULL,
	"status_code" integer NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"request_time" integer,
	"request_size" integer,
	"response_size" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"adminId" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entityId" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"details" text
);
--> statement-breakpoint
CREATE TABLE "centers" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"state" text NOT NULL,
	"lga" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" text NOT NULL,
	"createdById" text DEFAULT 'system' NOT NULL,
	"modifiedBy" text,
	"modifiedAt" timestamp,
	"modifiedById" text DEFAULT 'system' NOT NULL,
	CONSTRAINT "centers_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "dispute_centers" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"state" text NOT NULL,
	"lga" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"alternative_phone" text DEFAULT '00000000000' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"is_disputed" boolean DEFAULT false NOT NULL,
	"max_capacity" integer DEFAULT 50 NOT NULL,
	"current_cases" integer DEFAULT 0 NOT NULL,
	"total_staff" integer DEFAULT 0 NOT NULL,
	"available_arbitrators" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"created_by_id" text DEFAULT 'system' NOT NULL,
	"modified_by" text,
	"modified_at" timestamp,
	"modified_by_id" text DEFAULT 'system' NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" text,
	"deleted_by_id" text,
	CONSTRAINT "dispute_centers_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "email_verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp,
	CONSTRAINT "email_verifications_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" text PRIMARY KEY NOT NULL,
	"adminId" text NOT NULL,
	"token" text NOT NULL,
	"isUsed" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	CONSTRAINT "password_resets_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "admin_activities" ADD CONSTRAINT "admin_activities_adminId_admins_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_school" ADD CONSTRAINT "admin_school_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_school" ADD CONSTRAINT "admin_school_school_id_centers_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_adminId_admins_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_rate_limits" ADD CONSTRAINT "api_rate_limits_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminId_admins_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "centers" ADD CONSTRAINT "centers_createdById_admins_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."admins"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "centers" ADD CONSTRAINT "centers_modifiedById_admins_id_fk" FOREIGN KEY ("modifiedById") REFERENCES "public"."admins"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_centers" ADD CONSTRAINT "dispute_centers_created_by_id_admins_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."admins"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_centers" ADD CONSTRAINT "dispute_centers_modified_by_id_admins_id_fk" FOREIGN KEY ("modified_by_id") REFERENCES "public"."admins"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_centers" ADD CONSTRAINT "dispute_centers_deleted_by_id_admins_id_fk" FOREIGN KEY ("deleted_by_id") REFERENCES "public"."admins"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_adminId_admins_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admin_activity_activity" ON "admin_activities" USING btree ("activity");--> statement-breakpoint
CREATE INDEX "idx_admin_activity_timestamp" ON "admin_activities" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_admin_session_is_active" ON "admin_sessions" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "idx_admin_session_created_at" ON "admin_sessions" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_admin_session_expires_at" ON "admin_sessions" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "idx_admin_session_last_used" ON "admin_sessions" USING btree ("lastUsed");--> statement-breakpoint
CREATE INDEX "idx_admin_session_ip_address" ON "admin_sessions" USING btree ("ipAddress");--> statement-breakpoint
CREATE INDEX "idx_admin_session_device_type" ON "admin_sessions" USING btree ("deviceType");--> statement-breakpoint
CREATE INDEX "idx_admin_email" ON "admins" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_admin_is_active" ON "admins" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "idx_admin_role" ON "admins" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_admin_created_at" ON "admins" USING btree ("createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "api_key_key_idx" ON "api_keys" USING btree ("key");--> statement-breakpoint
CREATE INDEX "api_key_prefix_idx" ON "api_keys" USING btree ("prefix");--> statement-breakpoint
CREATE INDEX "api_key_admin_id_idx" ON "api_keys" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "api_key_is_active_idx" ON "api_keys" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "api_key_created_at_idx" ON "api_keys" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "api_key_expires_at_idx" ON "api_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "api_key_revoked_at_idx" ON "api_keys" USING btree ("revoked_at");--> statement-breakpoint
CREATE INDEX "idx_api_log_endpoint" ON "api_logs" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "idx_api_log_method" ON "api_logs" USING btree ("method");--> statement-breakpoint
CREATE INDEX "idx_api_log_status" ON "api_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_api_log_timestamp" ON "api_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "api_rate_limit_unique_idx" ON "api_rate_limits" USING btree ("api_key_id","endpoint","window_start");--> statement-breakpoint
CREATE INDEX "api_rate_limit_api_key_id_idx" ON "api_rate_limits" USING btree ("api_key_id");--> statement-breakpoint
CREATE INDEX "api_rate_limit_endpoint_idx" ON "api_rate_limits" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "api_rate_limit_window_start_idx" ON "api_rate_limits" USING btree ("window_start");--> statement-breakpoint
CREATE INDEX "api_rate_limit_window_end_idx" ON "api_rate_limits" USING btree ("window_end");--> statement-breakpoint
CREATE INDEX "api_usage_api_key_id_idx" ON "api_usage_logs" USING btree ("api_key_id");--> statement-breakpoint
CREATE INDEX "api_usage_endpoint_idx" ON "api_usage_logs" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "api_usage_method_idx" ON "api_usage_logs" USING btree ("method");--> statement-breakpoint
CREATE INDEX "api_usage_status_code_idx" ON "api_usage_logs" USING btree ("status_code");--> statement-breakpoint
CREATE INDEX "api_usage_created_at_idx" ON "api_usage_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "api_usage_ip_address_idx" ON "api_usage_logs" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "idx_audit_log_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_log_entity" ON "audit_logs" USING btree ("entity");--> statement-breakpoint
CREATE UNIQUE INDEX "center_name_state_lga_unique" ON "centers" USING btree ("name","state","lga");--> statement-breakpoint
CREATE INDEX "idx_center_state" ON "centers" USING btree ("state");--> statement-breakpoint
CREATE INDEX "idx_center_lga" ON "centers" USING btree ("lga");--> statement-breakpoint
CREATE INDEX "idx_center_is_active" ON "centers" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "idx_center_created_at" ON "centers" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_center_name" ON "centers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_center_number" ON "centers" USING btree ("number");--> statement-breakpoint
CREATE INDEX "idx_center_state_lga" ON "centers" USING btree ("state","lga");--> statement-breakpoint
CREATE INDEX "idx_center_lga_is_active" ON "centers" USING btree ("lga","isActive");--> statement-breakpoint
CREATE INDEX "idx_center_state_is_active" ON "centers" USING btree ("state","isActive");--> statement-breakpoint
CREATE INDEX "idx_center_created_by" ON "centers" USING btree ("createdBy");--> statement-breakpoint
CREATE INDEX "idx_center_modified_by" ON "centers" USING btree ("modifiedBy");--> statement-breakpoint
CREATE INDEX "idx_center_modified_at" ON "centers" USING btree ("modifiedAt");--> statement-breakpoint
CREATE INDEX "idx_center_created_at_is_active" ON "centers" USING btree ("createdAt","isActive");--> statement-breakpoint
CREATE INDEX "idx_center_created_by_id" ON "centers" USING btree ("createdById");--> statement-breakpoint
CREATE INDEX "idx_center_modified_by_id" ON "centers" USING btree ("modifiedById");--> statement-breakpoint
CREATE UNIQUE INDEX "dispute_center_number_unique" ON "dispute_centers" USING btree ("number");--> statement-breakpoint
CREATE UNIQUE INDEX "dispute_center_email_unique" ON "dispute_centers" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "dispute_center_name_state_lga_unique" ON "dispute_centers" USING btree ("name","state","lga");--> statement-breakpoint
CREATE INDEX "idx_dispute_center_is_disputed" ON "dispute_centers" USING btree ("is_disputed");--> statement-breakpoint
CREATE INDEX "idx_dispute_center_is_active" ON "dispute_centers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_dispute_center_status" ON "dispute_centers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_dispute_center_state" ON "dispute_centers" USING btree ("state");--> statement-breakpoint
CREATE INDEX "idx_dispute_center_lga" ON "dispute_centers" USING btree ("lga");--> statement-breakpoint
CREATE INDEX "idx_dispute_center_state_lga" ON "dispute_centers" USING btree ("state","lga");--> statement-breakpoint
CREATE INDEX "idx_dispute_center_email" ON "dispute_centers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_dispute_center_phone" ON "dispute_centers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_password_reset_is_used" ON "password_resets" USING btree ("isUsed");--> statement-breakpoint
CREATE INDEX "idx_password_reset_created_at" ON "password_resets" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_password_reset_expires_at" ON "password_resets" USING btree ("expiresAt");