import { mysqlTable, int, varchar, datetime, boolean, mysqlEnum } from 'drizzle-orm/mysql-core';

export const userRoleEnum = mysqlEnum('user_role', ['employee', 'hr_admin']);

export const users = mysqlTable('auth_users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum.notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').default(new Date()),
  updatedAt: datetime('updated_at').default(new Date()),
});

export const blacklistedTokens = mysqlTable('auth_blacklisted_tokens', {
  id: int('id').primaryKey().autoincrement(),
  token: varchar('token', { length: 500 }).notNull().unique(),
  expiresAt: datetime('expires_at').notNull(),
  createdAt: datetime('created_at').default(new Date()),
});
