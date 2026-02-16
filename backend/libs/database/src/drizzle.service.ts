import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/mysql2';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mysql = require('mysql2/promise');
import * as schema from './index';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private pool: any;
  public db: any;

  constructor() {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'dexa_db',
      connectionLimit: 10,
    };

    this.pool = mysql.createPool(config);
    this.db = drizzle(this.pool, { schema, mode: 'default' });
  }

  async onModuleInit() {
    // Auto-migrate on initialization for development
    if (process.env.NODE_ENV !== 'production') {
      // Migrations will be handled via drizzle-kit push in main.ts
      // This allows connection pooling to be ready before migration
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.db.execute({ sql: 'SELECT 1' });
      return true;
    } catch (error) {
      return false;
    }
  }
}
