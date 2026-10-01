import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    deviceName: text('device_name'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('refresh_tokens_user_id_idx').on(table.userId)]
);
