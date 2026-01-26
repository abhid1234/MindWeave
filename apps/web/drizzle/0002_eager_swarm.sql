ALTER TABLE "content" ADD COLUMN "is_shared" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "share_id" varchar(32);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_share_id_idx" ON "content" USING btree ("share_id");--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_share_id_unique" UNIQUE("share_id");