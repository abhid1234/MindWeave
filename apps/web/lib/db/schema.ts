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
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('content_user_id_idx').on(table.userId),
    typeIdx: index('content_type_idx').on(table.type),
    createdAtIdx: index('content_created_at_idx').on(table.createdAt),
    shareIdIdx: index('content_share_id_idx').on(table.shareId),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  content: many(content),
  accounts: many(accounts),
  sessions: many(sessions),
  collections: many(collections),
}));

export const contentRelations = relations(content, ({ one, many }) => ({
  user: one(users, {
    fields: [content.userId],
    references: [users.id],
  }),
  embeddings: many(embeddings),
  contentCollections: many(contentCollections),
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

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  contentCollections: many(contentCollections),
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
