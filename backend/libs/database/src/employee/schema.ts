import { mysqlTable, int, varchar, datetime, date, boolean } from 'drizzle-orm/mysql-core';

export const employees = mysqlTable('employee_employees', {
  id: int('id').primaryKey().autoincrement(),
  employeeCode: varchar('employee_code', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  department: varchar('department', { length: 100 }),
  position: varchar('position', { length: 100 }),
  joinDate: date('join_date').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').default(new Date()),
  updatedAt: datetime('updated_at').default(new Date()),
});
