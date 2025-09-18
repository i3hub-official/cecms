ALTER TABLE "admins" ADD COLUMN "failed_login_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "last_failed_login" timestamp;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "account_locked_until" timestamp;