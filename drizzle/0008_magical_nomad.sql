CREATE TABLE "token_blacklist" (
	"id" text PRIMARY KEY NOT NULL,
	"jti" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp DEFAULT now() NOT NULL,
	"reason" text,
	CONSTRAINT "token_blacklist_jti_unique" UNIQUE("jti")
);
--> statement-breakpoint
CREATE INDEX "token_blacklist_jti_idx" ON "token_blacklist" USING btree ("jti");--> statement-breakpoint
CREATE INDEX "token_blacklist_expires_at_idx" ON "token_blacklist" USING btree ("expires_at");