ALTER TABLE "centers" ADD CONSTRAINT "centers_createdById_admins_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."admins"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "centers" ADD CONSTRAINT "centers_modifiedById_admins_id_fk" FOREIGN KEY ("modifiedById") REFERENCES "public"."admins"("id") ON DELETE set default ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_center_created_by_id" ON "centers" USING btree ("createdById");--> statement-breakpoint
CREATE INDEX "idx_center_modified_by_id" ON "centers" USING btree ("modifiedById");