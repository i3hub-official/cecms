CREATE TABLE "admin_schools" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text,
	"school_id" text,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
DROP TABLE "admin_school" CASCADE;--> statement-breakpoint
ALTER TABLE "admin_schools" ADD CONSTRAINT "admin_schools_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_schools" ADD CONSTRAINT "admin_schools_school_id_centers_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_school_unique" ON "admin_schools" USING btree ("admin_id","school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "one_active_admin_per_school" ON "admin_schools" USING btree ("school_id","is_active");--> statement-breakpoint
CREATE INDEX "admin_school_school_idx" ON "admin_schools" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "admin_school_admin_idx" ON "admin_schools" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_school_active_idx" ON "admin_schools" USING btree ("is_active");