ALTER TABLE "admins" ADD COLUMN "failedLoginAttempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "accountLocked" boolean DEFAULT false NOT NULL;