import { mysqlTable, int, varchar, datetime, uniqueIndex } from 'drizzle-orm/mysql-core';

export const files = mysqlTable('file_files', {
  id: int('id').primaryKey().autoincrement(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  storedName: varchar('stored_name', { length: 255 }).notNull(),
  contentHash: varchar('content_hash', { length: 64 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  size: int('size').notNull(),
  bucket: varchar('bucket', { length: 100 }).notNull(),
  objectKey: varchar('object_key', { length: 512 }).notNull(),
  uploadedAt: datetime('uploaded_at').default(new Date()),
}, (table) => ({
  contentHashIdx: uniqueIndex('content_hash_idx').on(table.contentHash),
}));
