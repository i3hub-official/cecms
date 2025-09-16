CREATE TABLE "admin_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"adminId" text NOT NULL,
	"activity" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
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
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'ADMIN' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
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
	"modifiedBy" text,
	"modifiedAt" timestamp,
	CONSTRAINT "centers_number_unique" UNIQUE("number")
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
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_adminId_admins_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminId_admins_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "idx_api_log_endpoint" ON "api_logs" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "idx_api_log_method" ON "api_logs" USING btree ("method");--> statement-breakpoint
CREATE INDEX "idx_api_log_status" ON "api_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_api_log_timestamp" ON "api_logs" USING btree ("timestamp");--> statement-breakpoint
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
CREATE INDEX "idx_password_reset_is_used" ON "password_resets" USING btree ("isUsed");--> statement-breakpoint
CREATE INDEX "idx_password_reset_created_at" ON "password_resets" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_password_reset_expires_at" ON "password_resets" USING btree ("expiresAt");