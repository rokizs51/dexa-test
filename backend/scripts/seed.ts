import * as bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/mysql2';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mysql = require('mysql2/promise');
import { users } from '@dexa/database/auth/schema';
import { employees } from '@dexa/database/employee/schema';

const TEST_USERS = [
  {
    email: 'hr@company.com',
    password: 'admin123',
    role: 'hr_admin' as const,
    employeeCode: 'HR001',
    fullName: 'Sarah Admin',
    department: 'Human Resources',
    position: 'HR Manager',
  },
  {
    email: 'john@company.com',
    password: 'employee123',
    role: 'employee' as const,
    employeeCode: 'EMP001',
    fullName: 'John Doe',
    department: 'Engineering',
    position: 'Software Developer',
  },
  {
    email: 'jane@company.com',
    password: 'employee123',
    role: 'employee' as const,
    employeeCode: 'EMP002',
    fullName: 'Jane Smith',
    department: 'Marketing',
    position: 'Marketing Specialist',
  },
  {
    email: 'bob@company.com',
    password: 'employee123',
    role: 'employee' as const,
    employeeCode: 'EMP003',
    fullName: 'Bob Wilson',
    department: 'Finance',
    position: 'Financial Analyst',
  },
];

async function seed() {
  console.log('🌱 Starting database seeding...');

  // All services use a single MySQL database (dexa_db)
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'dexa_db',
    connectionLimit: 10,
  };

  const pool = mysql.createPool(dbConfig);
  const db = drizzle(pool, { mode: 'default' });

  try {
    // Check if users already exist
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log('⚠️  Users already exist in database. Skipping seed.');
      console.log('📊 Existing users:', existingUsers.map((u) => u.email));
      console.log('✅ Seed check completed.');
      await pool.end();
      process.exit(0);
    }

    console.log('👤 Creating test users...');

    for (const userData of TEST_USERS) {
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Insert user into auth_users table (MySQL doesn't support .returning())
      const insertResult = await db
        .insert(users)
        .values({
          email: userData.email,
          passwordHash,
          role: userData.role,
          isActive: true,
        });

      // Get the inserted user ID
      const userId = insertResult[0].insertId;

      console.log(`  ✓ Created user: ${userData.email} (${userData.role})`);

      // Insert corresponding employee record
      await db
        .insert(employees)
        .values({
          employeeCode: userData.employeeCode,
          email: userData.email,
          passwordHash,
          fullName: userData.fullName,
          department: userData.department,
          position: userData.position,
          joinDate: new Date(), // Today's date
        });

      console.log(`    └─ Employee record: ${userData.fullName} (${userData.employeeCode})`);
    }

    console.log('');
    console.log('✅ Seeding completed successfully!');
    console.log('');
    console.log('📝 Test Credentials:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('HR Admin:');
    console.log('  Email:    hr@company.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('Employees:');
    console.log('  Email:    john@company.com  Password: employee123');
    console.log('  Email:    jane@company.com  Password: employee123');
    console.log('  Email:    bob@company.com   Password: employee123');
    console.log('─────────────────────────────────────────────────────────────');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed()
  .then(() => {
    console.log('🎉 Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed script failed:', error);
    process.exit(1);
  });
