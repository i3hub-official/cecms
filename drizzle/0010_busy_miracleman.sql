ALTER TABLE "admins" ADD COLUMN "phone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_phone_unique" UNIQUE("phone");