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
ALTER TABLE "dispute_centers" ADD CONSTRAINT "dispute_centers_created_by_id_admins_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."admins"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_centers" ADD CONSTRAINT "dispute_centers_modified_by_id_admins_id_fk" FOREIGN KEY ("modified_by_id") REFERENCES "public"."admins"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_centers" ADD CONSTRAINT "dispute_centers_deleted_by_id_admins_id_fk" FOREIGN KEY ("deleted_by_id") REFERENCES "public"."admins"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "idx_dispute_center_phone" ON "dispute_centers" USING btree ("phone");