import { pgTable, text, varchar, timestamp, boolean, real, uniqueIndex, index, primaryKey, uuid } from 'drizzle-orm/pg-core';

// User management
export const users = pgTable('User', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  name: varchar('name', { length: 255 }),
  avatar: text('avatar'),
  status: varchar('status', { length: 255 }).default('offline'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  city: varchar('city', { length: 255 }),
  country: varchar('country', { length: 255 }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// AI Lock system
export const ailocks = pgTable('Ailock', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  mode: varchar('mode', { length: 255 }).default('creator').notNull(),
  ownerId: uuid('ownerId').notNull().references(() => users.id),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const ailockSessions = pgTable('AilockSession', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('userId').notNull().references(() => users.id),
  mode: varchar('mode', { length: 255 }).default('researcher').notNull(),
  location: text('location'),
  contextData: text('contextData'),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  lastActivity: timestamp('lastActivity').defaultNow().notNull(),
});

// Chat system
export const chats = pgTable('Chat', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }),
  mode: varchar('mode', { length: 255 }).default('researcher').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  lastActivity: timestamp('lastActivity').defaultNow().notNull(),
});

export const chatParticipants = pgTable('ChatParticipant', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('userId').notNull().references(() => users.id),
  chatId: uuid('chatId').notNull().references(() => chats.id),
  role: varchar('role', { length: 255 }).default('member').notNull(),
}, (table) => [
  uniqueIndex('ChatParticipant_userId_chatId_key').on(table.userId, table.chatId)
]);

export const messages = pgTable('Message', {
  id: uuid('id').defaultRandom().primaryKey(),
  content: text('content').notNull(),
  type: varchar('type', { length: 255 }).default('text').notNull(),
  senderId: uuid('senderId').notNull().references(() => users.id),
  chatId: uuid('chatId').notNull().references(() => chats.id),
  metadata: text('metadata'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// Chat sessions for different modes
export const chatSessions = pgTable('ChatSession', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('userId').notNull().references(() => users.id),
  ailockMode: varchar('ailockMode', { length: 255 }).default('creator').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  lastActivity: timestamp('lastActivity').defaultNow().notNull(),
});

export const chatMessages = pgTable('ChatMessage', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('sessionId').notNull().references(() => chatSessions.id),
  sender: text('sender').notNull(),
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Intents system
export const intents = pgTable('Intent', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('userId').notNull().references(() => users.id),
  sessionId: uuid('sessionId').references(() => chatSessions.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: varchar('type', { length: 255 }).default('request').notNull(),
  category: varchar('category', { length: 255 }).notNull(),
  location: text('location'),
  status: varchar('status', { length: 255 }).default('draft').notNull(),
  expiresAt: timestamp('expiresAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}); 