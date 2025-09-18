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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp,
	"usage_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
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
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_rate_limits" ADD CONSTRAINT "api_rate_limits_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_key_key_idx" ON "api_keys" USING btree ("key");--> statement-breakpoint
CREATE INDEX "api_key_prefix_idx" ON "api_keys" USING btree ("prefix");--> statement-breakpoint
CREATE INDEX "api_key_admin_id_idx" ON "api_keys" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "api_key_is_active_idx" ON "api_keys" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "api_key_created_at_idx" ON "api_keys" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "api_key_expires_at_idx" ON "api_keys" USING btree ("expires_at");--> statement-breakpoint
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
CREATE INDEX "api_usage_ip_address_idx" ON "api_usage_logs" USING btree ("ip_address");