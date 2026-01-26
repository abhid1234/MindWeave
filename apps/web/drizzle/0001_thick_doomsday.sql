ALTER TABLE "accounts" ALTER COLUMN "expires_at" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "expires" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "verificationTokens" ALTER COLUMN "expires" SET DATA TYPE integer;