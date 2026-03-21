CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"user_id" uuid,
	"event" text NOT NULL,
	"page" text NOT NULL,
	"referrer" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_id_a" uuid NOT NULL,
	"content_id_b" uuid NOT NULL,
	"insight" text NOT NULL,
	"similarity" integer NOT NULL,
	"tag_group_a" text[] DEFAULT '{}' NOT NULL,
	"tag_group_b" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "flashcards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"interval" varchar(10) DEFAULT '1d' NOT NULL,
	"next_review_at" timestamp NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_wrapped" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"share_id" varchar(32) NOT NULL,
	"stats" jsonb NOT NULL,
	"period" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_wrapped_share_id_unique" UNIQUE("share_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_path_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"is_optional" boolean DEFAULT false NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_path_progress" (
	"path_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "learning_path_progress_path_id_user_id_content_id_pk" PRIMARY KEY("path_id","user_id","content_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"estimated_minutes" integer,
	"difficulty" varchar(20),
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "marketplace_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"category" varchar(30) NOT NULL,
	"description" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"clone_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_listings_collection_id_unique" UNIQUE("collection_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public_graphs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"graph_id" varchar(32) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"graph_data" jsonb NOT NULL,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "public_graphs_graph_id_unique" UNIQUE("graph_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "til_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"upvote_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "til_posts_content_id_unique" UNIQUE("content_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "til_upvotes" (
	"til_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "til_upvotes_til_id_user_id_pk" PRIMARY KEY("til_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"badge_id" varchar(50) NOT NULL,
	"unlocked_at" timestamp DEFAULT now() NOT NULL,
	"notified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connections" ADD CONSTRAINT "connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connections" ADD CONSTRAINT "connections_content_id_a_content_id_fk" FOREIGN KEY ("content_id_a") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connections" ADD CONSTRAINT "connections_content_id_b_content_id_fk" FOREIGN KEY ("content_id_b") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_wrapped" ADD CONSTRAINT "knowledge_wrapped_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "learning_path_items" ADD CONSTRAINT "learning_path_items_path_id_learning_paths_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."learning_paths"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "learning_path_items" ADD CONSTRAINT "learning_path_items_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "learning_path_progress" ADD CONSTRAINT "learning_path_progress_path_id_learning_paths_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."learning_paths"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "learning_path_progress" ADD CONSTRAINT "learning_path_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "learning_path_progress" ADD CONSTRAINT "learning_path_progress_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "public_graphs" ADD CONSTRAINT "public_graphs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "til_posts" ADD CONSTRAINT "til_posts_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "til_posts" ADD CONSTRAINT "til_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "til_upvotes" ADD CONSTRAINT "til_upvotes_til_id_til_posts_id_fk" FOREIGN KEY ("til_id") REFERENCES "public"."til_posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "til_upvotes" ADD CONSTRAINT "til_upvotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_created_at_idx" ON "analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_event_idx" ON "analytics_events" USING btree ("event");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_session_id_idx" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "connections_user_id_idx" ON "connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "connections_content_id_a_idx" ON "connections" USING btree ("content_id_a");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "connections_content_id_b_idx" ON "connections" USING btree ("content_id_b");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flashcards_user_id_idx" ON "flashcards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flashcards_content_id_idx" ON "flashcards" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flashcards_user_next_review_idx" ON "flashcards" USING btree ("user_id","next_review_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flashcards_user_status_idx" ON "flashcards" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_wrapped_user_id_idx" ON "knowledge_wrapped" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_wrapped_share_id_idx" ON "knowledge_wrapped" USING btree ("share_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "learning_path_items_path_id_idx" ON "learning_path_items" USING btree ("path_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "learning_path_items_content_id_idx" ON "learning_path_items" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "learning_path_items_path_position_idx" ON "learning_path_items" USING btree ("path_id","position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "learning_path_progress_path_user_idx" ON "learning_path_progress" USING btree ("path_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "learning_paths_user_id_idx" ON "learning_paths" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "learning_paths_created_at_idx" ON "learning_paths" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "marketplace_listings_user_id_idx" ON "marketplace_listings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "marketplace_listings_category_idx" ON "marketplace_listings" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "marketplace_listings_clone_count_idx" ON "marketplace_listings" USING btree ("clone_count");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "marketplace_listings_published_at_idx" ON "marketplace_listings" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "marketplace_listings_is_featured_idx" ON "marketplace_listings" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "public_graphs_user_id_idx" ON "public_graphs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "public_graphs_graph_id_idx" ON "public_graphs" USING btree ("graph_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "til_posts_user_id_idx" ON "til_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "til_posts_upvote_count_idx" ON "til_posts" USING btree ("upvote_count");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "til_posts_published_at_idx" ON "til_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "til_posts_content_id_idx" ON "til_posts" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "til_upvotes_til_id_idx" ON "til_upvotes" USING btree ("til_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "til_upvotes_user_id_idx" ON "til_upvotes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_badges_user_badge_unique" ON "user_badges" USING btree ("user_id","badge_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_badges_user_id_idx" ON "user_badges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_badges_unlocked_at_idx" ON "user_badges" USING btree ("unlocked_at");