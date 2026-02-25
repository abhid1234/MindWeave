import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  jsonb,
  vector,
  index,
  integer,
  primaryKey,
  boolean,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

// Users table (Auth.js compatible)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').unique().notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  password: text('password'), // Nullable — OAuth users won't have one
  // Onboarding fields
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  onboardingStep: integer('onboarding_step').notNull().default(0),
  onboardingSkippedAt: timestamp('onboarding_skipped_at', { mode: 'date' }),
  onboardingCompletedAt: timestamp('onboarding_completed_at', { mode: 'date' }),
  // Profile fields
  username: varchar('username', { length: 50 }).unique(),
  bio: text('bio'),
  isProfilePublic: boolean('is_profile_public').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Auth.js tables
export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires').notNull(),
});

export const verificationTokens = pgTable(
  'verificationTokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: integer('expires').notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// Content types
export const contentTypeEnum = ['note', 'link', 'file'] as const;
export type ContentType = (typeof contentTypeEnum)[number];

// Content table (notes, links, files)
export const content = pgTable(
  'content',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 20 }).notNull().$type<ContentType>(),
    title: text('title').notNull(),
    body: text('body'),
    url: text('url'),
    metadata: jsonb('metadata').$type<{
      fileType?: string;
      fileSize?: number;
      filePath?: string;
      favicon?: string;
      domain?: string;
      [key: string]: unknown;
    }>(),
    tags: text('tags').array().notNull().default([]),
    autoTags: text('auto_tags').array().notNull().default([]),
    isShared: boolean('is_shared').notNull().default(false),
    shareId: varchar('share_id', { length: 32 }).unique(),
    isFavorite: boolean('is_favorite').notNull().default(false),
    summary: varchar('summary', { length: 500 }), // AI-generated summary
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('content_user_id_idx').on(table.userId),
    typeIdx: index('content_type_idx').on(table.type),
    createdAtIdx: index('content_created_at_idx').on(table.createdAt),
    shareIdIdx: index('content_share_id_idx').on(table.shareId),
    // Composite indexes for common query patterns
    userCreatedAtIdx: index('content_user_created_at_idx').on(table.userId, table.createdAt),
    userTypeIdx: index('content_user_type_idx').on(table.userId, table.type),
    userFavoriteIdx: index('content_user_favorite_idx').on(table.userId, table.isFavorite),
  })
);

// Collections table (folders for organizing content)
export const collections = pgTable(
  'collections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    color: varchar('color', { length: 7 }), // Hex color like #FF5733
    isPublic: boolean('is_public').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('collections_user_id_idx').on(table.userId),
    nameIdx: index('collections_name_idx').on(table.name),
  })
);

// Junction table for content-collections many-to-many relationship
export const contentCollections = pgTable(
  'content_collections',
  {
    contentId: uuid('content_id')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.contentId, table.collectionId] }),
    contentIdIdx: index('content_collections_content_id_idx').on(table.contentId),
    collectionIdIdx: index('content_collections_collection_id_idx').on(table.collectionId),
  })
);

// Devices table (for push notifications)
export const devices = pgTable(
  'devices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    platform: varchar('platform', { length: 20 }).notNull().$type<'ios' | 'android' | 'web'>(),
    isActive: boolean('is_active').notNull().default(true),
    lastUsed: timestamp('last_used').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('devices_user_id_idx').on(table.userId),
    tokenIdx: index('devices_token_idx').on(table.token),
    platformIdx: index('devices_platform_idx').on(table.platform),
  })
);

// Tasks table
export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    status: varchar('status', { length: 20 }).notNull().default('todo'),
    priority: varchar('priority', { length: 20 }).notNull().default('medium'),
    dueDate: timestamp('due_date', { mode: 'date' }),
    completedAt: timestamp('completed_at', { mode: 'date' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('tasks_user_id_idx').on(table.userId),
    statusIdx: index('tasks_status_idx').on(table.status),
    priorityIdx: index('tasks_priority_idx').on(table.priority),
    userCreatedAtIdx: index('tasks_user_created_at_idx').on(table.userId, table.createdAt),
  })
);

// Content Versions table (edit history)
export const contentVersions = pgTable(
  'content_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentId: uuid('content_id')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body'),
    url: text('url'),
    metadata: jsonb('metadata'),
    versionNumber: integer('version_number').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    contentIdIdx: index('content_versions_content_id_idx').on(table.contentId),
    contentCreatedAtIdx: index('content_versions_content_created_at_idx').on(
      table.contentId,
      table.createdAt
    ),
  })
);

// API Keys table (for external integrations)
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    keyPrefix: varchar('key_prefix', { length: 8 }).notNull(),
    keyHash: text('key_hash').unique().notNull(),
    lastUsedAt: timestamp('last_used_at', { mode: 'date' }),
    expiresAt: timestamp('expires_at', { mode: 'date' }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('api_keys_user_id_idx').on(table.userId),
    keyHashIdx: index('api_keys_key_hash_idx').on(table.keyHash),
    isActiveIdx: index('api_keys_is_active_idx').on(table.isActive),
  })
);

// Digest Settings table (for email digest preferences)
export const digestSettings = pgTable('digest_settings', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').notNull().default(false),
  frequency: varchar('frequency', { length: 10 }).notNull().default('weekly'),
  preferredDay: integer('preferred_day').notNull().default(1), // 0=Sun, 1=Mon, ...
  preferredHour: integer('preferred_hour').notNull().default(9), // 0-23 UTC
  lastSentAt: timestamp('last_sent_at', { mode: 'date' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Embeddings table (for semantic search)
export const embeddings = pgTable(
  'embeddings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentId: uuid('content_id')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    embedding: vector('embedding', { dimensions: 768 }).notNull(), // Gemini text-embedding-004 dimension
    model: varchar('model', { length: 100 }).notNull().default('text-embedding-004'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    contentIdIdx: index('embeddings_content_id_idx').on(table.contentId),
  })
);

// Generated Posts table (LinkedIn post generator)
export const generatedPosts = pgTable(
  'generated_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postContent: text('post_content').notNull(),
    tone: varchar('tone', { length: 20 }).notNull(),
    length: varchar('length', { length: 20 }).notNull(),
    includeHashtags: boolean('include_hashtags').notNull().default(true),
    sourceContentIds: jsonb('source_content_ids').$type<string[]>().notNull(),
    sourceContentTitles: jsonb('source_content_titles').$type<string[]>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('generated_posts_user_id_idx').on(table.userId),
    createdAtIdx: index('generated_posts_created_at_idx').on(table.createdAt),
  })
);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  content: many(content),
  accounts: many(accounts),
  sessions: many(sessions),
  collections: many(collections),
  devices: many(devices),
  tasks: many(tasks),
  apiKeys: many(apiKeys),
  digestSettings: one(digestSettings),
  contentViews: many(contentViews),
  generatedPosts: many(generatedPosts),
}));

export const contentRelations = relations(content, ({ one, many }) => ({
  user: one(users, {
    fields: [content.userId],
    references: [users.id],
  }),
  embeddings: many(embeddings),
  contentCollections: many(contentCollections),
  versions: many(contentVersions),
  views: many(contentViews),
}));

export const embeddingsRelations = relations(embeddings, ({ one }) => ({
  content: one(content, {
    fields: [embeddings.contentId],
    references: [content.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const devicesRelations = relations(devices, ({ one }) => ({
  user: one(users, {
    fields: [devices.userId],
    references: [users.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  contentCollections: many(contentCollections),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

export const contentCollectionsRelations = relations(contentCollections, ({ one }) => ({
  content: one(content, {
    fields: [contentCollections.contentId],
    references: [content.id],
  }),
  collection: one(collections, {
    fields: [contentCollections.collectionId],
    references: [collections.id],
  }),
}));

export const contentVersionsRelations = relations(contentVersions, ({ one }) => ({
  content: one(content, {
    fields: [contentVersions.contentId],
    references: [content.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const digestSettingsRelations = relations(digestSettings, ({ one }) => ({
  user: one(users, {
    fields: [digestSettings.userId],
    references: [users.id],
  }),
}));

// Content Views table (for view tracking / behavioral signals)
export const contentViews = pgTable(
  'content_views',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    contentId: uuid('content_id')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    viewedAt: timestamp('viewed_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('content_views_user_id_idx').on(table.userId),
    contentIdIdx: index('content_views_content_id_idx').on(table.contentId),
    userViewedAtIdx: index('content_views_user_viewed_at_idx').on(table.userId, table.viewedAt),
    userContentViewedAtIdx: index('content_views_user_content_viewed_at_idx').on(
      table.userId,
      table.contentId,
      table.viewedAt
    ),
  })
);

// Feedback table
export const feedbackTypeEnum = ['bug', 'feature', 'improvement', 'other'] as const;
export type FeedbackType = (typeof feedbackTypeEnum)[number];

export const feedback = pgTable(
  'feedback',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    type: varchar('type', { length: 20 }).notNull().$type<FeedbackType>(),
    message: text('message').notNull(),
    email: text('email'), // For anonymous users
    page: text('page'), // Current page URL
    userAgent: text('user_agent'),
    status: varchar('status', { length: 20 }).notNull().default('new'),
    resolvedAt: timestamp('resolved_at', { mode: 'date' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('feedback_user_id_idx').on(table.userId),
    statusIdx: index('feedback_status_idx').on(table.status),
    typeIdx: index('feedback_type_idx').on(table.type),
    createdAtIdx: index('feedback_created_at_idx').on(table.createdAt),
  })
);

export const contentViewsRelations = relations(contentViews, ({ one }) => ({
  user: one(users, {
    fields: [contentViews.userId],
    references: [users.id],
  }),
  content: one(content, {
    fields: [contentViews.contentId],
    references: [content.id],
  }),
}));

export const generatedPostsRelations = relations(generatedPosts, ({ one }) => ({
  user: one(users, {
    fields: [generatedPosts.userId],
    references: [users.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;

export type Embedding = typeof embeddings.$inferSelect;
export type NewEmbedding = typeof embeddings.$inferInsert;

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;

export type ContentCollection = typeof contentCollections.$inferSelect;
export type NewContentCollection = typeof contentCollections.$inferInsert;

export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;

export type ContentVersion = typeof contentVersions.$inferSelect;
export type NewContentVersion = typeof contentVersions.$inferInsert;

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

export type DigestSetting = typeof digestSettings.$inferSelect;
export type NewDigestSetting = typeof digestSettings.$inferInsert;

export type ContentView = typeof contentViews.$inferSelect;
export type NewContentView = typeof contentViews.$inferInsert;

export type GeneratedPost = typeof generatedPosts.$inferSelect;
export type NewGeneratedPost = typeof generatedPosts.$inferInsert;
