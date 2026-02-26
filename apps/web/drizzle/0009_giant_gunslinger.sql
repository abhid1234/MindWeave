CREATE TABLE IF NOT EXISTS "collection_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" varchar(20) NOT NULL,
	"token" varchar(64) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"invited_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "collection_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "collection_members" (
	"collection_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collection_members_collection_id_user_id_pk" PRIMARY KEY("collection_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_highlights" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"content_id" uuid NOT NULL,
	"insight" text NOT NULL,
	"date" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"interval" varchar(10) NOT NULL,
	"next_remind_at" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"secret" text,
	"config" jsonb,
	"last_received_at" timestamp,
	"total_received" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "collection_invitations" ADD CONSTRAINT "collection_invitations_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "collection_invitations" ADD CONSTRAINT "collection_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "collection_members" ADD CONSTRAINT "collection_members_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "collection_members" ADD CONSTRAINT "collection_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_highlights" ADD CONSTRAINT "daily_highlights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_highlights" ADD CONSTRAINT "daily_highlights_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reminders" ADD CONSTRAINT "reminders_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhook_configs" ADD CONSTRAINT "webhook_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collection_invitations_collection_id_idx" ON "collection_invitations" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collection_invitations_token_idx" ON "collection_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collection_invitations_email_idx" ON "collection_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collection_invitations_status_idx" ON "collection_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collection_members_collection_id_idx" ON "collection_members" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collection_members_user_id_idx" ON "collection_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_highlights_date_idx" ON "daily_highlights" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reminders_user_id_idx" ON "reminders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reminders_content_id_idx" ON "reminders" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reminders_status_idx" ON "reminders" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reminders_next_remind_at_idx" ON "reminders" USING btree ("next_remind_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_configs_user_id_idx" ON "webhook_configs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_configs_type_idx" ON "webhook_configs" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_configs_is_active_idx" ON "webhook_configs" USING btree ("is_active");