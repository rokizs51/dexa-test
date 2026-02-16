import { mysqlTable, int, varchar, datetime, text, uniqueIndex } from 'drizzle-orm/mysql-core';

export const attendance = mysqlTable('attendance_records', {
  id: int('id').primaryKey().autoincrement(),
  employeeCode: varchar('employee_code', { length: 50 }).notNull(),
  checkInTime: datetime('check_in_time').notNull(),
  checkOutTime: datetime('check_out_time'),
  photoUrl: varchar('photo_url', { length: 512 }),
  checkOutPhotoUrl: varchar('check_out_photo_url', { length: 512 }),
  totalWorkingHours: varchar('total_working_hours', { length: 50 }), // Store as "8h 30m" format
  status: varchar('status', { length: 50 }).default('submitted'),
  rejectionReason: text('rejection_reason'),
  createdAt: datetime('created_at').default(new Date()),
  updatedAt: datetime('updated_at').default(new Date()),
}, (table) => ({
  // Note: MySQL doesn't support function-based unique constraints
  // Unique check on employee code and date should be handled in application layer
}));
