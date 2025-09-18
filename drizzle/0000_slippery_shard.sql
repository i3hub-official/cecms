CREATE TABLE "admin_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"activity" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"session_id" text NOT NULL,
	"token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_used" timestamp DEFAULT now() NOT NULL,
	"user_agent" text,
	"ip_address" text,
	"location" text,
	"device_type" text,
	CONSTRAINT "admin_sessions_session_id_unique" UNIQUE("session_id"),
	CONSTRAINT "admin_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'ADMIN' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
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
	"admin_id" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
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
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"modified_by" text,
	"modified_at" timestamp,
	CONSTRAINT "centers_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"token" text NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "password_resets_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "admin_activities" ADD CONSTRAINT "admin_activities_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admin_activity_activity" ON "admin_activities" USING btree ("activity");--> statement-breakpoint
CREATE INDEX "idx_admin_activity_timestamp" ON "admin_activities" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_admin_session_is_active" ON "admin_sessions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_admin_session_created_at" ON "admin_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_admin_session_expires_at" ON "admin_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_admin_session_last_used" ON "admin_sessions" USING btree ("last_used");--> statement-breakpoint
CREATE INDEX "idx_admin_session_ip_address" ON "admin_sessions" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "idx_admin_session_device_type" ON "admin_sessions" USING btree ("device_type");--> statement-breakpoint
CREATE INDEX "idx_admin_email" ON "admins" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_admin_is_active" ON "admins" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_admin_role" ON "admins" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_admin_created_at" ON "admins" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_api_log_endpoint" ON "api_logs" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "idx_api_log_method" ON "api_logs" USING btree ("method");--> statement-breakpoint
CREATE INDEX "idx_api_log_status" ON "api_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_api_log_timestamp" ON "api_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_audit_log_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_log_entity" ON "audit_logs" USING btree ("entity");--> statement-breakpoint
CREATE UNIQUE INDEX "center_name_state_lga_unique" ON "centers" USING btree ("name","state","lga");--> statement-breakpoint
CREATE INDEX "idx_center_state" ON "centers" USING btree ("state");--> statement-breakpoint
CREATE INDEX "idx_center_lga" ON "centers" USING btree ("lga");--> statement-breakpoint
CREATE INDEX "idx_center_is_active" ON "centers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_center_created_at" ON "centers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_center_name" ON "centers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_center_number" ON "centers" USING btree ("number");--> statement-breakpoint
CREATE INDEX "idx_center_state_lga" ON "centers" USING btree ("state","lga");--> statement-breakpoint
CREATE INDEX "idx_center_lga_is_active" ON "centers" USING btree ("lga","is_active");--> statement-breakpoint
CREATE INDEX "idx_center_state_is_active" ON "centers" USING btree ("state","is_active");--> statement-breakpoint
CREATE INDEX "idx_center_created_by" ON "centers" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_center_modified_by" ON "centers" USING btree ("modified_by");--> statement-breakpoint
CREATE INDEX "idx_center_modified_at" ON "centers" USING btree ("modified_at");--> statement-breakpoint
CREATE INDEX "idx_center_created_at_is_active" ON "centers" USING btree ("created_at","is_active");--> statement-breakpoint
CREATE INDEX "idx_password_reset_is_used" ON "password_resets" USING btree ("is_used");--> statement-breakpoint
CREATE INDEX "idx_password_reset_created_at" ON "password_resets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_password_reset_expires_at" ON "password_resets" USING btree ("expires_at");